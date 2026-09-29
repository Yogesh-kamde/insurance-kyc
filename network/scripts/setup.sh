#!/bin/bash

set -e

echo "⏳ Waiting for network to be ready..."
sleep 10

export PATH=/usr/local/bin:$PATH
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/config

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
ORDERER_ADMIN_TLS_SIGN_CERT=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
ORDERER_ADMIN_TLS_PRIVATE_KEY=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key
CHANNEL_NAME=insurancechannel

setOrg1() {
    export CORE_PEER_LOCALMSPID=Org1MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
}

setOrg2() {
    export CORE_PEER_LOCALMSPID=Org2MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=peer0.org2.example.com:9051
}

setOrg3() {
    export CORE_PEER_LOCALMSPID=Org3MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=peer0.org3.example.com:11051
}

# ─── Step 1: Create channel using Channel Participation API ─────
echo "📦 Creating channel ${CHANNEL_NAME}..."
osnadmin channel join \
    --channelID $CHANNEL_NAME \
    --config-block ./config/${CHANNEL_NAME}.block \
    -o orderer.example.com:7053 \
    --ca-file $ORDERER_CA \
    --client-cert $ORDERER_ADMIN_TLS_SIGN_CERT \
    --client-key $ORDERER_ADMIN_TLS_PRIVATE_KEY

sleep 3

# ─── Step 2: Join peers to channel ──────────────────────────────
echo "🔗 Joining Org1 peer to channel..."
setOrg1
peer channel join -b ./config/${CHANNEL_NAME}.block --tls --cafile $ORDERER_CA

echo "🔗 Joining Org2 peer to channel..."
setOrg2
peer channel join -b ./config/${CHANNEL_NAME}.block --tls --cafile $ORDERER_CA

echo "🔗 Joining Org3 peer to channel..."
setOrg3
peer channel join -b ./config/${CHANNEL_NAME}.block --tls --cafile $ORDERER_CA


# ─── Step 4: Package chaincode ──────────────────────────────────
echo "📝 Packaging chaincode..."
setOrg1
peer lifecycle chaincode package kyc.tar.gz \
    --path ./chaincode \
    --lang golang \
    --label kyc_1.0

# ─── Step 5: Install chaincode on all peers ─────────────────────
echo "📥 Installing chaincode on Org1..."
setOrg1
peer lifecycle chaincode install kyc.tar.gz

echo "📥 Installing chaincode on Org2..."
setOrg2
peer lifecycle chaincode install kyc.tar.gz

echo "📥 Installing chaincode on Org3..."
setOrg3
peer lifecycle chaincode install kyc.tar.gz

# ─── Step 6: Get package ID ─────────────────────────────────────
setOrg1
CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "kyc_1.0" | awk '{print $3}' | tr -d ',')
echo "📦 Package ID: $CC_PACKAGE_ID"

# ─── Step 7: Approve for all orgs ───────────────────────────────
echo "✅ Approving for Org1..."
setOrg1
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version 1.0 \
    --package-id $CC_PACKAGE_ID \
    --sequence 1 --tls \
    --cafile $ORDERER_CA

echo "✅ Approving for Org2..."
setOrg2
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version 1.0 \
    --package-id $CC_PACKAGE_ID \
    --sequence 1 --tls \
    --cafile $ORDERER_CA

echo "✅ Approving for Org3..."
setOrg3
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version 1.0 \
    --package-id $CC_PACKAGE_ID \
    --sequence 1 --tls \
    --cafile $ORDERER_CA

# ─── Step 8: Commit chaincode ───────────────────────────────────
echo "🔒 Committing chaincode..."
setOrg1
peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version 1.0 --sequence 1 --tls \
    --cafile $ORDERER_CA \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses peer0.org2.example.com:9051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    --peerAddresses peer0.org3.example.com:11051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

echo "🎉 Channel and chaincode setup complete!"
