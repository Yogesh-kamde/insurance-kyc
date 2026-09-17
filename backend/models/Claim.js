const mongoose = require('mongoose')

const claimSchema = new mongoose.Schema({
    claimID: { type: String, required: true, unique: true },
    policyId: { type: String, required: true },
    customerID: { type: String, required: true },
    reason: { type: String, required: true },
    claimAmount: { type: String, required: true },
    supportingDocument: { type: String },
    documentHash: { type: String },
    status: { type: String, default: 'PENDING' },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Claim', claimSchema)
