require('dotenv').config()
const { getContract } = require('./utils/fabric')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Customer = require('./models/Customer')

const seedData = [
    {
        username: 'customer1',
        password: 'pass123',
        role: 'customer',
        customerID: 'CUST-SEED001',
        fullName: 'Yogesh Kamde',
        contact: '9893196562',
        address: 'Raipur Chhattisgarh',
        income: '500000',
        identityProof: 'Aadhar'
    },
    {
        username: 'customer2',
        password: 'pass123',
        role: 'customer',
        customerID: 'CUST-SEED002',
        fullName: 'Rahul Sharma',
        contact: '9876543210',
        address: 'Mumbai Maharashtra',
        income: '700000',
        identityProof: 'PAN'
    }
]

const staffUsers = [
    { username: 'regulator1', password: 'pass123', role: 'regulator' },
    { username: 'insurer1', password: 'pass123', role: 'insurer' },
    { username: 'assessor1', password: 'pass123', role: 'assessor' },
    { username: 'payout1', password: 'pass123', role: 'payout' }
]

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✅ MongoDB connected')

        const { contract, gateway, client } = await getContract('org1')
        console.log('✅ Fabric connected')

        // Seed customers
        for (const data of seedData) {
            // Register on blockchain
            try {
                await contract.submitTransaction(
                    'RegisterCustomer',
                    data.customerID,
                    data.fullName,
                    data.contact,
                    data.address,
                    data.income,
                    data.identityProof
                )
                console.log(`✅ Blockchain: ${data.customerID} registered`)
            } catch (err) {
                console.log(`⚠️  Blockchain: ${data.customerID} already exists — skipping`)
            }

            // Save to User collection
            try {
                const existing = await User.findOne({ username: data.username })
                if (!existing) {
                    const salt = await bcrypt.genSalt(10)
                    const hashedPassword = await bcrypt.hash(data.password, salt)
                    await User.create({
                        username: data.username,
                        password: hashedPassword,
                        role: data.role,
                        customerID: data.customerID
                    })
                    console.log(`✅ User: ${data.username} created`)
                } else {
                    await User.findOneAndUpdate(
                        { username: data.username },
                        { customerID: data.customerID }
                    )
                    console.log(`✅ User: ${data.username} customerID updated`)
                }
            } catch (err) {
                console.log(`⚠️  User: ${data.username}: ${err.message}`)
            }

            // Sync Customer collection — reset kycStatus on fresh network
            try {
                await Customer.findOneAndUpdate(
                    { customerID: data.customerID },
                    {
                        kycStatus: 'PENDING',
                        fullName: data.fullName,
                        contact: data.contact,
                        address: data.address,
                        income: data.income,
                        identityProof: data.identityProof
                    },
                    { upsert: true, new: true }
                )
                console.log(`✅ Customer: ${data.customerID} synced — kycStatus PENDING`)
            } catch (err) {
                console.log(`⚠️  Customer: ${err.message}`)
            }
        }

        // Seed staff users
        for (const staff of staffUsers) {
            try {
                const existing = await User.findOne({ username: staff.username })
                if (!existing) {
                    const salt = await bcrypt.genSalt(10)
                    const hashedPassword = await bcrypt.hash(staff.password, salt)
                    await User.create({
                        username: staff.username,
                        password: hashedPassword,
                        role: staff.role
                    })
                    console.log(`✅ Staff: ${staff.username} created`)
                } else {
                    console.log(`⚠️  Staff: ${staff.username} already exists`)
                }
            } catch (err) {
                console.log(`⚠️  Staff: ${staff.username}: ${err.message}`)
            }
        }

        gateway.close()
        client.close()
        console.log('🎉 Seed complete!')
        process.exit(0)
    } catch (err) {
        console.error('❌ Seed failed:', err.message)
        process.exit(1)
    }
}

seed()
