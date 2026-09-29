const mongoose = require('mongoose')

const policySchema = new mongoose.Schema({
    policyId: { type: String, required: true, unique: true },
    customerID: { type: String, required: true },
    policyType: { type: String, required: true },
    coverageAmount: { type: String, required: true },
    status: { type: String, default: 'ACTIVE' },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Policy', policySchema)