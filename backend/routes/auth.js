const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { getContract } = require('../utils/fabric')
const router = express.Router()
const Customer = require('../models/Customer')

// Register — customers only
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, contact, address, income, identityProof } = req.body

        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username already exists' })
        }

        const customerID = 'CUST-' + Date.now()

        const { contract, gateway, client } = await getContract('org1')
        await contract.submitTransaction('RegisterCustomer', customerID, fullName, contact, address, income, identityProof)
        gateway.close()
        client.close()

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = new User({ username, password: hashedPassword, role: 'customer', customerID })
        await user.save()
        const customerDoc = new Customer({
            customerID,
            fullName,
            contact,
            address,
            income,
            identityProof,
            kycStatus: 'PENDING'
        })
        await customerDoc.save()

        res.json({ success: true, message: 'Registration successful', customerID })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role, customerID: user.customerID },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,      // set to true in production with HTTPS
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000  // 8 hours
        })

        res.json({
            success: true,
            role: user.role,
            username: user.username,
            customerID: user.customerID
            // token NOT sent in response body — it's in the cookie
        })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
})
// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token')
    res.json({ success: true, message: 'Logged out successfully' })
})


module.exports = router
