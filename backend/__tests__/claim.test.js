process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const jwt = require('jsonwebtoken')

jest.mock('../utils/fabric')
jest.mock('../utils/db', () => jest.fn())
jest.mock('../models/Claim')

const { getContract, __mockContract } = require('../utils/fabric')
const Claim = require('../models/Claim')
const app = require('../app')

app.set('io', { emit: jest.fn() })

const insurerToken = jwt.sign({ role: 'insurer' }, process.env.JWT_SECRET)
const payoutToken = jwt.sign({ role: 'payout' }, process.env.JWT_SECRET)
const assessorToken = jwt.sign({ role: 'assessor' }, process.env.JWT_SECRET)
const customerToken = jwt.sign({ role: 'customer' }, process.env.JWT_SECRET)

beforeEach(() => {
    jest.clearAllMocks()
    Claim.mockImplementation(function (doc) {
        return { ...doc, save: jest.fn().mockResolvedValue(true) }
    })
    Claim.findOneAndUpdate = jest.fn().mockResolvedValue(true)
    jest.spyOn(Date, 'now').mockReturnValue(1234567890)
})

afterEach(() => {
    Date.now.mockRestore()
})

describe('POST /claim/file', () => {
    const validBody = { customerID: 'CUST1', policyId: 'POL-1', reason: 'Accident', claimAmount: '50000' }

    test('rejects when role is not insurer', async () => {
        const res = await request(app)
            .post('/claim/file')
            .set('Cookie', [`token=${customerToken}`])
            .send(validBody)
        expect(res.status).toBe(403)
    })

    test('rejects non-numeric claimAmount', async () => {
        const res = await request(app)
            .post('/claim/file')
            .set('Cookie', [`token=${insurerToken}`])
            .send({ ...validBody, claimAmount: 'abc' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Claim amount must be a number')
    })

    test('succeeds and calls chaincode with generated claimID', async () => {
        const res = await request(app)
            .post('/claim/file')
            .set('Cookie', [`token=${insurerToken}`])
            .send(validBody)

        expect(res.status).toBe(200)
        expect(res.body.claimID).toBe('CLM-1234567890')
        expect(__mockContract.submitTransaction).toHaveBeenCalledWith(
            'FileClaim', 'CUST1', 'POL-1', 'CLM-1234567890', 'Accident', '50000'
        )
    })
})

describe('POST /claim/payout', () => {
    test('rejects when role is not payout', async () => {
        const res = await request(app)
            .post('/claim/payout')
            .set('Cookie', [`token=${insurerToken}`])
            .send({ claimID: 'CLM-1', payoutAmount: '50000' })
        expect(res.status).toBe(403)
    })

    test('rejects missing payoutAmount', async () => {
        const res = await request(app)
            .post('/claim/payout')
            .set('Cookie', [`token=${payoutToken}`])
            .send({ claimID: 'CLM-1' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Payout amount must be a number')
    })

    test('succeeds and marks claim as PAID', async () => {
        const res = await request(app)
            .post('/claim/payout')
            .set('Cookie', [`token=${payoutToken}`])
            .send({ claimID: 'CLM-1', payoutAmount: '50000' })

        expect(res.status).toBe(200)
        expect(getContract).toHaveBeenCalledWith('org1')
        expect(__mockContract.submitTransaction).toHaveBeenCalledWith('ProcessPayout', 'CLM-1', '50000')
        expect(Claim.findOneAndUpdate).toHaveBeenCalledWith({ claimID: 'CLM-1' }, { status: 'PAID', payoutAmount: '50000' })
    })
})

describe('POST /claim/assess', () => {
    test('rejects when role is not assessor', async () => {
        const res = await request(app)
            .post('/claim/assess')
            .set('Cookie', [`token=${payoutToken}`])
            .send({ claimID: 'CLM-1', decision: 'APPROVED' })
        expect(res.status).toBe(403)
    })

   test('succeeds and calls chaincode on org3', async () => {
    const res = await request(app)
        .post('/claim/assess')
        .set('Cookie', [`token=${assessorToken}`])
        .send({ claimID: 'CLM-1', decision: 'ASSESSED' })

    expect(res.status).toBe(200)
    expect(getContract).toHaveBeenCalledWith('org3')
    expect(__mockContract.submitTransaction).toHaveBeenCalledWith('AssessClaim', 'CLM-1', 'ASSESSED')
    expect(Claim.findOneAndUpdate).toHaveBeenCalledWith({ claimID: 'CLM-1' }, { status: 'ASSESSED' })
})
    test('rejects missing claimID', async () => {
        const res = await request(app)
            .post('/claim/assess')
            .set('Cookie', [`token=${assessorToken}`])
            .send({ decision: 'APPROVED' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Claim ID is required')
    })

    test('rejects an invalid decision value', async () => {
        const res = await request(app)
            .post('/claim/assess')
            .set('Cookie', [`token=${assessorToken}`])
            .send({ claimID: 'CLM-1', decision: 'MAYBE' })
        expect(res.status).toBe(400)
        expect(res.body.errors).toContain('Decision must be ASSESSED or REJECTED')
    })
})