require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { getContract } = require('./utils/fabric')
const auth = require('./middleware/auth')
const authRoutes = require('./routes/auth')
const connectDB = require('./utils/db')
const Customer = require('./models/Customer')
const Claim = require('./models/Claim')
const crypto = require('crypto')
const Policy = require('./models/Policy')
const bcrypt = require('bcryptjs')
const { validateRegister, validateKYC, validatePolicy, validateClaim, validatePayout } = require('./middleware/validate')
const cookieParser = require('cookie-parser')


// Connect to MongoDB
connectDB()

const app = express()
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true  // ← required for cookies
}))
app.use(express.json())
app.use(cookieParser())


// Auth routes — public
app.use('/auth', authRoutes)

// Admin register - for creating staff users
app.post('/auth/admin-register', async (req, res) => {
    try {
        const { username, password, role } = req.body
        const User = require('./models/User')
        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username already exists' })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = new User({ username, password: hashedPassword, role })
        await user.save()
        res.json({ success: true, message: 'Staff user created' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
app.post('/customer/register', auth(['customer']),validateRegister, async (req, res) => {
    try {
        const { customerID, fullName, contact, address, income, identityProof, kycDocument } = req.body

        // Hash the KYC document if provided
        let kycDocumentHash = ''
        if (kycDocument) {
            kycDocumentHash = crypto.createHash('sha256').update(kycDocument).digest('hex')
        }

        // Save to blockchain
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('RegisterCustomer', customerID, fullName, contact, address, income, identityProof)
        gateway.close()
        client.close()

        // Save to MongoDB
        const customerDoc = new Customer({
            customerID,
            fullName,
            contact,
            address,
            income,
            identityProof,
            kycDocument,        // full document off-chain
            kycDocumentHash     // hash on-chain for integrity
        })
        await customerDoc.save()

        res.json({ success: true, message: 'Customer registered successfully', kycDocumentHash })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Get Customer — customer and regulator
app.get('/customer/:customerID', auth(['customer', 'regulator']), async (req, res) => {
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

app.post('/kyc/verify', auth(['regulator']), validateKYC, async (req, res) => {
    try {
        const { customerID, decision } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('VerifyKYC', customerID, decision)
        gateway.close()
        client.close()

        // Sync to MongoDB
        await Customer.findOneAndUpdate(
            { customerID },
            { kycStatus: decision }
        )

        // Emit real-time notification
        const io = req.app.get('io')
        io.emit('kycUpdate', {
            customerID,
            status: decision,
            message: `KYC ${decision} for customer ${customerID}`
        })

        res.json({ success: true, message: `KYC ${decision} for ${customerID}` })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Issue Policy - insurer only
app.post('/policy/issue', auth(['insurer']), validatePolicy, async (req, res) => {
    try {
        const { policyType, customerID, coverageAmount } = req.body

        // Auto-generate policyId
        const policyId = 'POL-' + Date.now()

        // Save to blockchain
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('IssuePolicy', policyId, policyType, customerID, coverageAmount)
        gateway.close()
        client.close()

        // Save to MongoDB
        const policyDoc = new Policy({ policyId, customerID, policyType, coverageAmount })
        await policyDoc.save()

        // Emit real-time notification
        const io = req.app.get('io')
        io.emit('policyIssued', {
            customerID,
            policyId,
            message: `Policy ${policyId} issued for customer ${customerID}`
        })

        res.json({ success: true, message: 'Policy issued successfully', policyId })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// Get Policy — insurer and customer
app.get('/policy/:policyId', auth(['insurer', 'customer']), async (req, res) => {
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

app.post('/claim/file', auth(['insurer']), validateClaim, async (req, res) => {
    try {
        const { customerID, policyId, reason, claimAmount, supportingDocument } = req.body

        // Auto-generate claimID
        const claimID = 'CLM-' + Date.now()

        // Hash supporting document if provided
        let documentHash = ''
        if (supportingDocument) {
            documentHash = crypto.createHash('sha256').update(supportingDocument).digest('hex')
        }

        // Save to blockchain
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('FileClaim', customerID, policyId, claimID, reason, claimAmount)
        gateway.close()
        client.close()

        // Save to MongoDB
        const claimDoc = new Claim({ claimID, policyId, customerID, reason, claimAmount, supportingDocument, documentHash })
        await claimDoc.save()

        res.json({ success: true, message: 'Claim filed successfully', claimID })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})

// Process Payout
app.post('/claim/payout', auth(['payout']), validatePayout, async (req, res) => {
    try {
        const { claimID, payoutAmount } = req.body
        const { contract, gateway, client } = await getContract()
        await contract.submitTransaction('ProcessPayout', claimID, payoutAmount)
        gateway.close()
        client.close()

        // Update MongoDB status
        await Claim.findOneAndUpdate({ claimID }, { status: 'PAID', payoutAmount })

        res.json({ success: true, message: 'Payout processed successfully' })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Assess Claim -assessor only (Org3)
app.post('/claim/assess', auth(['assessor']), async (req, res) => {
    try {
        const { claimID, decision } = req.body
        const { contract, gateway, client } = await getContract('org3')
        await contract.submitTransaction('AssessClaim', claimID, decision)
        gateway.close()
        client.close()

        // Update MongoDB status
        await Claim.findOneAndUpdate({ claimID }, { status: decision })

        // Emit real-time notification
        const io = req.app.get('io')
        io.emit('claimUpdate', {
            claimID,
            status: decision,
            message: `Claim ${claimID} ${decision} by Claims Assessor`
        })

        res.json({ success: true, message: `Claim ${decision} successfully` })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Get policies by customerID
app.get('/policy/customer/:customerID', auth(['customer', 'insurer']), async (req, res) => {
    try {
        const policies = await Policy.find({ customerID: req.params.customerID })
        res.json(policies)
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Get claims by customerID
app.get('/claim/customer/:customerID', auth(['customer', 'insurer']), async (req, res) => {
    try {
        const claims = await Claim.find({ customerID: req.params.customerID })
        res.json(claims)
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Get pending claims -assessor only
app.get('/claim/pending', auth(['assessor']), async (req, res) => {
    try {
        const claims = await Claim.find({ status: 'PENDING' })
        res.json(claims)
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Get assessed claims - payout officer only
app.get('/claim/assessed', auth(['payout']), async (req, res) => {
    try {
        const claims = await Claim.find({ status: 'ASSESSED' })
        res.json(claims)
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Get all pending KYC customers — regulator only
app.get('/customers/pending', auth(['regulator']), async (req, res) => {
    try {
        const customers = await Customer.find({ kycStatus: 'PENDING' })
        res.json(customers)
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// WebSocket setup
const http = require('http')
const { Server } = require('socket.io')

const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: 'http://localhost:3001', methods: ['GET', 'POST'] }
})

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
    })
})

// Make io available to routes
app.set('io', io)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))