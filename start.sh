#!/bin/bash

echo " Starting Insurance KYC Platform..."

#  Step 1: Start Fabric Network 
echo " Starting Hyperledger Fabric network..."
cd ~/hyperledger/fabric-samples/test-network
./network.sh down
./network.sh up -ca
./network.sh createChannel -c insurancechannel

# Step 2: Add Org3 
echo " Adding Org3 (Claims Assessor)..."
cd addOrg3
./addOrg3.sh up -c insurancechannel -ca
cd ..

#  Step 3: Setup environment 
echo "  Setting up environment..."
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true

#  Step 4: Package chaincode 
echo " Packaging chaincode..."
peer lifecycle chaincode package kyc.tar.gz \
  --path ~/hyperledger/insurance-kyc/chaincode \
  --lang golang \
  --label kyc_1.0

#  Step 5: Install on Org1 
echo " Installing chaincode on Org1..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install kyc.tar.gz

#  Step 6: Install on Org2
echo " Installing chaincode on Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install kyc.tar.gz

#  Step 7: Install on Org3 
echo " Installing chaincode on Org3..."
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode install kyc.tar.gz

#  Step 8: Get Package ID 
echo " Getting package ID..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "kyc_1.0" | awk '{print $3}' | tr -d ',')
echo "Package ID: $CC_PACKAGE_ID"

#  Step 9: Approve for Org1 
echo " Approving for Org1..."
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --channelID insurancechannel --name kyc --version 1.0 \
  --package-id $CC_PACKAGE_ID --sequence 1 --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

#  Step 10: Approve for Org2 
echo " Approving for Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --channelID insurancechannel --name kyc --version 1.0 \
  --package-id $CC_PACKAGE_ID --sequence 1 --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

#  Step 11: Approve for Org3
echo " Approving for Org3..."
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --channelID insurancechannel --name kyc --version 1.0 \
  --package-id $CC_PACKAGE_ID --sequence 1 --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Step 12: Commit 
echo " Committing chaincode..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode commit \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --channelID insurancechannel --name kyc --version 1.0 --sequence 1 --tls \
  --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  --peerAddresses localhost:11051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

#Step 13: Seed test data
echo "Seeding test data..."
cd ~/hyperledger/insurance-kyc/backend
node seed.js


#Step 14: Start Backend 
echo " Starting Node.js backend..."
cd ~/hyperledger/insurance-kyc/backend
node app.js &

#  Step 15: Start Frontend 
echo "Starting React frontend..."
cd ~/hyperledger/insurance-kyc/frontend
npm start &

echo "   Insurance KYC Platform is running!"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:3000"