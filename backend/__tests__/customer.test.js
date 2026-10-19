process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const jwt = require('jsonwebtoken')

jest.mock('../utils/fabric')
jest.mock('../utils/db', () => jest.fn())
jest.mock('../models/Customer')

const { getContract } = require('../utils/fabric')
const Customer = require('../models/Customer')
const app = require('../app')

const customerToken = jwt.sign({ customerID: 'CUST1', role: 'customer' }, process.env.JWT_SECRET)
const regulatorToken = jwt.sign({ role: 'regulator' }, process.env.JWT_SECRET)

const validBody = {
    customerID: 'CUST1',
    fullName: 'Jane Doe',
    contact: '9999999999',
    address: 'Some Address',
    income: '500000',
    identityProof: 'PAN123'
}

beforeEach(() => {
    jest.clearAllMocks()
})

describe('POST /customer/register', () => {
    test('rejects when no token provided', async () => {
        const res = await request(app).post('/customer/register').send(validBody)
        expect(res.status).toBe(401)
    })

    test('rejects when role is not customer', async () => {
        const res = await request(app)
            .post('/customer/register')
            .set('Cookie', [`token=${regulatorToken}`])
            .send(validBody)
        expect(res.status).toBe(403)
    })

    test('rejects when required fields are missing', async () => {
        const res = await request(app)
            .post('/customer/register')
            .set('Cookie', [`token=${customerToken}`])
            .send({ customerID: 'CUST1' })
        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toContain('Full name is required')
    })

    test('rejects contact not exactly 10 digits', async () => {
        const res = await request(app)
            .post('/customer/register')
            .set('Cookie', [`token=${customerToken}`])
            .send({ ...validBody, contact: '12345' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Contact must be 10 digits')
    })

    test('succeeds with valid data and calls chaincode with correct args', async () => {
        Customer.mockImplementation(function (doc) {
            return { ...doc, save: jest.fn().mockResolvedValue(true) }
        })

        const res = await request(app)
            .post('/customer/register')
            .set('Cookie', [`token=${customerToken}`])
            .send(validBody)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(getContract).toHaveBeenCalledWith('org1')

        const { __mockContract } = require('../utils/fabric')
        expect(__mockContract.submitTransaction).toHaveBeenCalledWith(
            'RegisterCustomer', 'CUST1', 'Jane Doe', '9999999999', 'Some Address', '500000', 'PAN123'
        )
    })
})