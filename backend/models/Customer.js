const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    customerID: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    income: { type: String, required: true },
    identityProof: { type: String, required: true },
    kycStatus: { type: String, default: 'PENDING' },
    kycDocumentHash: { type: String },
    kycDocument: { type: String },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Customer', customerSchema)
