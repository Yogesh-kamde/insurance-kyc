const grpc = require('@grpc/grpc-js')
const { connect, signers } = require('@hyperledger/fabric-gateway')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Support both Docker and local paths
const getNetworkPath = () => {
    if (process.env.NETWORK_ORG_PATH) {
        return process.env.NETWORK_ORG_PATH
    }
    const dockerPath = '/organizations'
    if (fs.existsSync(dockerPath)) {
        return dockerPath
    }
    // fallback for anyone running without .env configured
    return path.resolve(
        process.env.HOME, 'hyperledger', 'insurance-kyc',
        'network', 'organizations'
    )
}

async function getContract(org = 'org1') {
    const networkPath = getNetworkPath()

    const orgConfig = {
        org1: {
            mspId: 'Org1MSP',
            certPath: path.join(networkPath, 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem'),
            keyPath: path.join(networkPath, 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'keystore'),
            tlsCertPath: path.join(networkPath, 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
            peerEndpoint: process.env.PEER_ENDPOINT || 'localhost:7051',
            peerHostAlias: process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com'
        },
        org2: {
            mspId: 'Org2MSP',
            certPath: path.join(networkPath, 'peerOrganizations', 'org2.example.com', 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'cert.pem'),
            keyPath: path.join(networkPath, 'peerOrganizations', 'org2.example.com', 'users', 'User1@org2.example.com', 'msp', 'keystore'),
            tlsCertPath: path.join(networkPath, 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt'),
            peerEndpoint: process.env.PEER_ENDPOINT_ORG2 || 'localhost:9051',
            peerHostAlias: 'peer0.org2.example.com'
        },
        org3: {
            mspId: 'Org3MSP',
            certPath: path.join(networkPath, 'peerOrganizations', 'org3.example.com', 'users', 'User1@org3.example.com', 'msp', 'signcerts', 'cert.pem'),
            keyPath: path.join(networkPath, 'peerOrganizations', 'org3.example.com', 'users', 'User1@org3.example.com', 'msp', 'keystore'),
            tlsCertPath: path.join(networkPath, 'peerOrganizations', 'org3.example.com', 'peers', 'peer0.org3.example.com', 'tls', 'ca.crt'),
            peerEndpoint: process.env.PEER_ENDPOINT_ORG3 || 'localhost:11051',
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

    const network = gateway.getNetwork(process.env.CHANNEL_NAME || 'insurancechannel')
    const contract = network.getContract(process.env.CHAINCODE_NAME || 'kyc')

    return { contract, gateway, client }
}

module.exports = { getContract }
