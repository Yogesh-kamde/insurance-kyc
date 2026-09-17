const grpc = require('@grpc/grpc-js')
const { connect, signers } = require('@hyperledger/fabric-gateway')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const networkPath = path.resolve(
    process.env.HOME, 'hyperledger', 'fabric-samples',
    'test-network', 'organizations', 'peerOrganizations'
)

async function getContract(org = 'org1') {
    const orgConfig = {
        org1: {
            mspId: 'Org1MSP',
            certPath: path.join(networkPath, 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem'),
            keyPath: path.join(networkPath, 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'keystore'),
            tlsCertPath: path.join(networkPath, 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
            peerEndpoint: 'localhost:7051',
            peerHostAlias: 'peer0.org1.example.com'
        },
        org2: {
            mspId: 'Org2MSP',
            certPath: path.join(networkPath, 'org2.example.com', 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'cert.pem'),
            keyPath: path.join(networkPath, 'org2.example.com', 'users', 'User1@org2.example.com', 'msp', 'keystore'),
            tlsCertPath: path.join(networkPath, 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt'),
            peerEndpoint: 'localhost:9051',
            peerHostAlias: 'peer0.org2.example.com'
        },
        org3: {
            mspId: 'Org3MSP',
            certPath: path.join(networkPath, 'org3.example.com', 'users', 'User1@org3.example.com', 'msp', 'signcerts', 'cert.pem'),
            keyPath: path.join(networkPath, 'org3.example.com', 'users', 'User1@org3.example.com', 'msp', 'keystore'),
            tlsCertPath: path.join(networkPath, 'org3.example.com', 'peers', 'peer0.org3.example.com', 'tls', 'ca.crt'),
            peerEndpoint: 'localhost:11051',
            peerHostAlias: 'peer0.org3.example.com'
        }
    }

    const config = orgConfig[org]
    const tlsCredentials = grpc.credentials.createSsl(fs.readFileSync(config.tlsCertPath))

    const client = new grpc.Client(
        config.peerEndpoint,
        tlsCredentials,
        { 'grpc.ssl_target_name_override': config.peerHostAlias }
    )

    const privateKeyFiles = fs.readdirSync(config.keyPath)
    const privateKey = crypto.createPrivateKey(
        fs.readFileSync(path.join(config.keyPath, privateKeyFiles[0]))
    )
    const certificate = fs.readFileSync(config.certPath)

    const gateway = connect({
        client,
        identity: { mspId: config.mspId, credentials: certificate },
        signer: signers.newPrivateKeySigner(privateKey),
    })

    const network = gateway.getNetwork(process.env.CHANNEL_NAME)
    const contract = network.getContract(process.env.CHAINCODE_NAME)

    return { contract, gateway, client }
}

module.exports = { getContract }