process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')

jest.mock('../utils/fabric')
jest.mock('../utils/db', () => jest.fn())
jest.mock('../models/User')
jest.mock('../models/Customer')

const { getContract, __mockContract, __mockProposal } = require('../utils/fabric')
const User = require('../models/User')
const Customer = require('../models/Customer')
const app = require('../app')

const validBody = {
    username: 'janedoe',
    password: 'password123',
    fullName: 'Jane Doe',
    contact: '9999999999',
    address: 'Some Address',
    income: '500000',
    identityProof: 'PAN123'
}

beforeEach(() => {
    jest.clearAllMocks()
    User.mockImplementation(function (doc) {
        return { ...doc, save: jest.fn().mockResolvedValue(true) }
    })
    Customer.mockImplementation(function (doc) {
        return { ...doc, save: jest.fn().mockResolvedValue(true) }
    })
})

describe('POST /auth/register', () => {
    test('rejects when username already exists', async () => {
        User.findOne = jest.fn().mockResolvedValue({ username: 'janedoe' })

        const res = await request(app).post('/auth/register').send(validBody)

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.error).toBe('Username already exists')
    })

    test('succeeds and submits PII via transient data, not plain arguments', async () => {
        User.findOne = jest.fn().mockResolvedValue(null)

        const res = await request(app).post('/auth/register').send(validBody)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.customerID).toMatch(/^CUST-\d+$/)

        expect(getContract).toHaveBeenCalledWith('org1')

        // RegisterCustomer should only receive the customerID as a plain argument
        expect(__mockContract.newProposal).toHaveBeenCalledWith(
            'RegisterCustomer',
            expect.objectContaining({
                arguments: [res.body.customerID]
            })
        )

        // PII should travel in transientData, never as a plain argument
        const call = __mockContract.newProposal.mock.calls[0][1]
        const sentPII = JSON.parse(call.transientData.customer_pii.toString())
        expect(sentPII).toEqual({
            fullName: 'Jane Doe',
            contact: '9999999999',
            address: 'Some Address',
            income: '500000',
            identityProof: 'PAN123'
        })

        expect(__mockProposal.endorse).toHaveBeenCalled()

        // submitTransaction (the old plain-argument path) must NOT be used for registration
        expect(__mockContract.submitTransaction).not.toHaveBeenCalled()
    })

    test('returns 500 when chaincode endorsement fails', async () => {
        User.findOne = jest.fn().mockResolvedValue(null)
        __mockProposal.endorse.mockRejectedValueOnce(new Error('endorsement failed'))

        const res = await request(app).post('/auth/register').send(validBody)

        expect(res.status).toBe(500)
        expect(res.body.success).toBe(false)
    })
})