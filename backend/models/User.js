const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'regulator', 'insurer', 'assessor', 'payout'], required: true, default: 'customer' },
    customerID: { type: String },
    createdAt: { type: Date, default: Date.now }
})

// Compare password method
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema)