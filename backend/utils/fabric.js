const grpc = require('@grpc/grpc-js')
const { connect, signers } = require('@hyperledger/fabric-gateway')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const cryptoPath = path.resolve(
    process.env.HOME, 'hyperledger', 'fabric-samples',
    'test-network', 'organizations', 'peerOrganizations',
    'org1.example.com'
)

const keyPath = path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore')
const certPath = path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem')
const tlsCertPath = path.join(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')

async function getContract() {
    const tlsCredentials = grpc.credentials.createSsl(fs.readFileSync(tlsCertPath))

    const client = new grpc.Client(
        process.env.PEER_ENDPOINT,
        tlsCredentials,
        { 'grpc.ssl_target_name_override': process.env.PEER_HOST_ALIAS }
    )

    const privateKeyFiles = fs.readdirSync(keyPath)
    const privateKey = crypto.createPrivateKey(
        fs.readFileSync(path.join(keyPath, privateKeyFiles[0]))
    )
    const certificate = fs.readFileSync(certPath)

    const gateway = connect({
        client,
        identity: { mspId: process.env.MSP_ID, credentials: certificate },
        signer: signers.newPrivateKeySigner(privateKey),
    })

    const network = gateway.getNetwork(process.env.CHANNEL_NAME)
    const contract = network.getContract(process.env.CHAINCODE_NAME)

    return { contract, gateway, client }
}

module.exports = { getContract }