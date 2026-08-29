require('dotenv').config()
const express = require('express')
const { getContract } = require('./utils/fabric')

const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())

// Register Customer
app.post('/customer/register', async (req, res) => {
    try {
        const { customerID, fullName, contact, address, income, identityProof } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('RegisterCustomer', customerID, fullName, contact, address, income, identityProof)
        gateway.close()
        client.close()
        res.json({ success: true, message: 'Customer registered successfully' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// Get Customer
app.get('/customer/:customerID', async (req, res) => {
    try {
        const { contract, gateway, client } = await getContract()
        const result = await contract.evaluateTransaction('GetCustomer', req.params.customerID)
        gateway.close()
        client.close()
        res.json(JSON.parse(Buffer.from(result).toString('utf8')))
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Verify KYC
app.post('/kyc/verify', async (req, res) => {
    try {
        const { customerID, decision } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('VerifyKYC', customerID, decision)
        gateway.close()
        client.close()
        res.json({ success: true, message: `KYC ${decision} for ${customerID}` })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// Issue Policy
app.post('/policy/issue', async (req, res) => {
    try {
        const { policyId, policyType, customerID, coverageAmount } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('IssuePolicy', policyId, policyType, customerID, coverageAmount)
        gateway.close()
        client.close()
        res.json({ success: true, message: 'Policy issued successfully' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// Get Policy
app.get('/policy/:policyId', async (req, res) => {
    try {
        const { contract, gateway, client } = await getContract()
        const result = await contract.evaluateTransaction('GetPolicy', '', req.params.policyId)
        gateway.close()
        client.close()
        res.json(JSON.parse(Buffer.from(result).toString('utf8')))
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// File Claim
app.post('/claim/file', async (req, res) => {
    try {
        const { customerID, policyId, claimID, reason, claimAmount } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('FileClaim', customerID, policyId, claimID, reason, claimAmount)
        gateway.close()
        client.close()
        res.json({ success: true, message: 'Claim filed successfully' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// Process Payout
app.post('/claim/payout', async (req, res) => {
    try {
        const { claimID, payoutAmount } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('ProcessPayout', claimID, payoutAmount)
        gateway.close()
        client.close()
        res.json({ success: true, message: 'Payout processed successfully' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))