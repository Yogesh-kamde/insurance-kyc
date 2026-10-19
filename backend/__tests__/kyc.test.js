process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const jwt = require('jsonwebtoken')

jest.mock('../utils/fabric')
jest.mock('../utils/db', () => jest.fn())
jest.mock('../models/Customer')

const { getContract, __mockContract } = require('../utils/fabric')
const Customer = require('../models/Customer')
const app = require('../app')

app.set('io', { emit: jest.fn() })

const regulatorToken = jwt.sign({ role: 'regulator' }, process.env.JWT_SECRET)
const customerToken = jwt.sign({ role: 'customer' }, process.env.JWT_SECRET)

beforeEach(() => {
    jest.clearAllMocks()
    Customer.findOneAndUpdate = jest.fn().mockResolvedValue(true)
})

describe('POST /kyc/verify', () => {
    test('rejects when no token provided', async () => {
        const res = await request(app).post('/kyc/verify').send({ customerID: 'CUST1', decision: 'APPROVED' })
        expect(res.status).toBe(401)
    })

    test('rejects when role is not regulator', async () => {
        const res = await request(app)
            .post('/kyc/verify')
            .set('Cookie', [`token=${customerToken}`])
            .send({ customerID: 'CUST1', decision: 'APPROVED' })
        expect(res.status).toBe(403)
    })

    test('rejects an invalid decision value', async () => {
        const res = await request(app)
            .post('/kyc/verify')
            .set('Cookie', [`token=${regulatorToken}`])
            .send({ customerID: 'CUST1', decision: 'MAYBE' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Decision must be APPROVED or REJECTED')
    })

    test('succeeds and calls chaincode on org2 with correct args', async () => {
        const res = await request(app)
            .post('/kyc/verify')
            .set('Cookie', [`token=${regulatorToken}`])
            .send({ customerID: 'CUST1', decision: 'APPROVED' })

        expect(res.status).toBe(200)
        expect(getContract).toHaveBeenCalledWith('org2')
        expect(__mockContract.submitTransaction).toHaveBeenCalledWith('VerifyKYC', 'CUST1', 'APPROVED')
        expect(Customer.findOneAndUpdate).toHaveBeenCalledWith({ customerID: 'CUST1' }, { kycStatus: 'APPROVED' })
    })
})