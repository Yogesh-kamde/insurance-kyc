set -e

export PATH=/usr/local/bin:$PATH
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/config

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
CHANNEL_NAME=insurancechannel
CC_VERSION=2.0
CC_SEQUENCE=2

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

echo "📝 Packaging updated chaincode (v${CC_VERSION})..."
setOrg1
peer lifecycle chaincode package kyc.tar.gz \
    --path ./chaincode \
    --lang golang \
    --label kyc_${CC_VERSION}

echo "📥 Installing on Org1..."
setOrg1
peer lifecycle chaincode install kyc.tar.gz

echo "📥 Installing on Org2..."
setOrg2
peer lifecycle chaincode install kyc.tar.gz

echo "📥 Installing on Org3..."
setOrg3
peer lifecycle chaincode install kyc.tar.gz

setOrg1
CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "kyc_${CC_VERSION}" | awk '{print $3}' | tr -d ',')
echo "📦 Package ID: $CC_PACKAGE_ID"

echo "✅ Approving for Org1..."
setOrg1
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version $CC_VERSION \
    --package-id $CC_PACKAGE_ID \
    --sequence $CC_SEQUENCE --tls \
    --cafile $ORDERER_CA

echo "✅ Approving for Org2..."
setOrg2
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version $CC_VERSION \
    --package-id $CC_PACKAGE_ID \
    --sequence $CC_SEQUENCE --tls \
    --cafile $ORDERER_CA

echo "✅ Approving for Org3..."
setOrg3
peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version $CC_VERSION \
    --package-id $CC_PACKAGE_ID \
    --sequence $CC_SEQUENCE --tls \
    --cafile $ORDERER_CA

echo "🔍 Checking commit readiness..."
setOrg1
peer lifecycle chaincode checkcommitreadiness \
    --channelID $CHANNEL_NAME \
    --name kyc --version $CC_VERSION \
    --sequence $CC_SEQUENCE --tls \
    --cafile $ORDERER_CA --output json

echo "🔒 Committing chaincode..."
setOrg1
peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME \
    --name kyc --version $CC_VERSION --sequence $CC_SEQUENCE --tls \
    --cafile $ORDERER_CA \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses peer0.org2.example.com:9051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    --peerAddresses peer0.org3.example.com:11051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

echo "🎉 Chaincode upgraded to version ${CC_VERSION}, sequence ${CC_SEQUENCE}"