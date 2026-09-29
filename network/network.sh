#!/bin/bash

set -e
export HOST_UID=$(id -u)
export GID=$(id -g)
export PATH=$PATH:~/hyperledger/fabric-samples/bin
export FABRIC_CFG_PATH=${PWD}

CHANNEL_NAME=insurancechannel

startCAs() {
    echo "🚀 Starting Certificate Authorities..."
    mkdir -p organizations/fabric-ca/org1
    mkdir -p organizations/fabric-ca/org2
    mkdir -p organizations/fabric-ca/org3
    mkdir -p organizations/fabric-ca/orderer
    docker compose -f docker-compose.yml up -d \
        ca.org1.example.com \
        ca.org2.example.com \
        ca.org3.example.com \
        ca.orderer.example.com
    echo "⏳ Waiting for CAs to generate TLS certificates..."
    while [ ! -f organizations/fabric-ca/org1/tls-cert.pem ]; do sleep 1; done
    while [ ! -f organizations/fabric-ca/org2/tls-cert.pem ]; do sleep 1; done
    while [ ! -f organizations/fabric-ca/org3/tls-cert.pem ]; do sleep 1; done
    while [ ! -f organizations/fabric-ca/orderer/tls-cert.pem ]; do sleep 1; done
    echo "✅ All CAs ready!"
}

generateCrypto() {
    echo "🔐 Generating crypto material..."
    ./scripts/registerEnroll.sh
}

generateChannelArtifacts() {
    echo "📦 Generating channel artifacts..."
    mkdir -p config
    cp ~/hyperledger/fabric-samples/config/core.yaml config/
    cp ~/hyperledger/fabric-samples/config/orderer.yaml config/


    configtxgen -profile InsuranceChannelV2 \
        -outputBlock ./config/${CHANNEL_NAME}.block \
        -channelID ${CHANNEL_NAME}

    configtxgen -profile InsuranceChannelV2 \
        -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx \
        -channelID ${CHANNEL_NAME} \
        -asOrg Org1MSP

    configtxgen -profile InsuranceChannelV2 \
        -outputAnchorPeersUpdate ./config/Org2MSPanchors.tx \
        -channelID ${CHANNEL_NAME} \
        -asOrg Org2MSP

    configtxgen -profile InsuranceChannelV2 \
        -outputAnchorPeersUpdate ./config/Org3MSPanchors.tx \
        -channelID ${CHANNEL_NAME} \
        -asOrg Org3MSP
}

startNetwork() {
    echo "🚀 Starting network..."
    docker compose -f docker-compose.yml up -d \
        orderer.example.com \
        peer0.org1.example.com \
        peer0.org2.example.com \
        peer0.org3.example.com
    echo "⏳ Waiting for network to start..."
    sleep 5
}

setupChannel() {
    echo "📺 Setting up channel and chaincode..."
    docker compose -f docker-compose.yml run --rm cli \
        bash ./scripts/setup.sh
}

networkUp() {
    startCAs
    generateCrypto
    generateChannelArtifacts
    startNetwork
    setupChannel
    echo "🎉 Network is up!"
}

networkDown() {
    echo "🛑 Stopping network..."
    docker compose -f docker-compose.yml down -v
    echo "🧹 Cleaning up crypto material..."
    sudo rm -rf organizations/peerOrganizations
    sudo rm -rf organizations/ordererOrganizations
    sudo rm -rf organizations/fabric-ca/org1/msp organizations/fabric-ca/org1/data
    sudo rm -rf organizations/fabric-ca/org2/msp organizations/fabric-ca/org2/data
    sudo rm -rf organizations/fabric-ca/org3/msp organizations/fabric-ca/org3/data
    sudo rm -rf organizations/fabric-ca/orderer/msp organizations/fabric-ca/orderer/data
    sudo rm -f organizations/fabric-ca/org1/tls-cert.pem organizations/fabric-ca/org1/fabric-ca-server.db organizations/fabric-ca/org1/ca-cert.pem organizations/fabric-ca/org1/IssuerPublicKey organizations/fabric-ca/org1/IssuerRevocationPublicKey
    sudo rm -f organizations/fabric-ca/org2/tls-cert.pem organizations/fabric-ca/org2/fabric-ca-server.db organizations/fabric-ca/org2/ca-cert.pem organizations/fabric-ca/org2/IssuerPublicKey organizations/fabric-ca/org2/IssuerRevocationPublicKey
    sudo rm -f organizations/fabric-ca/org3/tls-cert.pem organizations/fabric-ca/org3/fabric-ca-server.db organizations/fabric-ca/org3/ca-cert.pem organizations/fabric-ca/org3/IssuerPublicKey organizations/fabric-ca/org3/IssuerRevocationPublicKey
    sudo rm -f organizations/fabric-ca/orderer/tls-cert.pem organizations/fabric-ca/orderer/fabric-ca-server.db organizations/fabric-ca/orderer/ca-cert.pem organizations/fabric-ca/orderer/IssuerPublicKey organizations/fabric-ca/orderer/IssuerRevocationPublicKey
    sudo rm -rf config
    echo "✅ Network down and cleaned up"
}

case "$1" in
    up)
        networkUp
        ;;
    down)
        networkDown
        ;;
    restart)
        networkDown
        networkUp
        ;;
    *)
        echo "Usage: ./network.sh [up|down|restart]"
        exit 1
        ;;
esac
