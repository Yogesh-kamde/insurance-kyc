process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const jwt = require('jsonwebtoken')

jest.mock('../utils/fabric')
jest.mock('../utils/db', () => jest.fn())
jest.mock('../models/Policy')

const { getContract, __mockContract } = require('../utils/fabric')
const Policy = require('../models/Policy')
const app = require('../app')

app.set('io', { emit: jest.fn() })

const insurerToken = jwt.sign({ role: 'insurer' }, process.env.JWT_SECRET)
const customerToken = jwt.sign({ role: 'customer' }, process.env.JWT_SECRET)
const regulatorToken = jwt.sign({ role: 'regulator' }, process.env.JWT_SECRET)

beforeEach(() => {
    jest.clearAllMocks()
    Policy.mockImplementation(function (doc) {
        return { ...doc, save: jest.fn().mockResolvedValue(true) }
    })
    jest.spyOn(Date, 'now').mockReturnValue(1234567890)
})

afterEach(() => {
    Date.now.mockRestore()
})

describe('POST /policy/issue', () => {
    const validBody = { policyType: 'Health', customerID: 'CUST1', coverageAmount: '100000' }

    test('rejects when no token provided', async () => {
        const res = await request(app).post('/policy/issue').send(validBody)
        expect(res.status).toBe(401)
    })

    test('rejects when role is not insurer', async () => {
        const res = await request(app)
            .post('/policy/issue')
            .set('Cookie', [`token=${customerToken}`])
            .send(validBody)
        expect(res.status).toBe(403)
    })

    test('rejects non-numeric coverageAmount', async () => {
        const res = await request(app)
            .post('/policy/issue')
            .set('Cookie', [`token=${insurerToken}`])
            .send({ ...validBody, coverageAmount: 'abc' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Coverage amount must be a number')
    })

    test('succeeds and calls chaincode with generated policyId', async () => {
        const res = await request(app)
            .post('/policy/issue')
            .set('Cookie', [`token=${insurerToken}`])
            .send(validBody)

        expect(res.status).toBe(200)
        expect(res.body.policyId).toBe('POL-1234567890')
        expect(getContract).toHaveBeenCalledWith('org1')
        expect(__mockContract.submitTransaction).toHaveBeenCalledWith(
            'IssuePolicy', 'POL-1234567890', 'Health', 'CUST1', '100000'
        )
    })

    test('surfaces the real chaincode rejection reason when coverage is not positive', async () => {
        __mockContract.submitTransaction.mockRejectedValueOnce({
            message: '10 ABORTED: failed to endorse transaction, see attached details for more info',
            details: [{ message: 'chaincode response 500, coverage amount must be greater than zero' }]
        })

        const res = await request(app)
            .post('/policy/issue')
            .set('Cookie', [`token=${insurerToken}`])
            .send({ ...validBody, coverageAmount: '0' })

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('coverage amount must be greater than zero')
    }) 
})

describe('GET /policy/:policyId', () => {
    test('rejects when role is regulator (not allowed)', async () => {
        const res = await request(app)
            .get('/policy/POL-1')
            .set('Cookie', [`token=${regulatorToken}`])
        expect(res.status).toBe(403)
    })

    test('allows customer to fetch a policy', async () => {
        __mockContract.evaluateTransaction.mockResolvedValueOnce(
            Buffer.from(JSON.stringify({ policyId: 'POL-1', status: 'ACTIVE' }))
        )

        const res = await request(app)
            .get('/policy/POL-1')
            .set('Cookie', [`token=${customerToken}`])

        expect(res.status).toBe(200)
        expect(res.body.policyId).toBe('POL-1')
        expect(__mockContract.evaluateTransaction).toHaveBeenCalledWith('GetPolicy', '', 'POL-1')
    })
})