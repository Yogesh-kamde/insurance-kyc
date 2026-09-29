#!/bin/bash

set -e

echo "🔐 Generating crypto material..."

export PATH=$PATH:~/hyperledger/fabric-samples/bin

NETWORK_DIR=${PWD}
ORGS_DIR=${NETWORK_DIR}/organizations

# ─── Org1 ───────────────────────────────────────────────────────
echo "📋 Enrolling Org1 CA admin..."
mkdir -p ${ORGS_DIR}/peerOrganizations/org1.example.com/msp

export FABRIC_CA_CLIENT_HOME=${ORGS_DIR}/peerOrganizations/org1.example.com

fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 \
    --caname ca-org1 \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: orderer' > ${ORGS_DIR}/peerOrganizations/org1.example.com/msp/config.yaml

fabric-ca-client register --caname ca-org1 \
    --id.name peer0 --id.secret peer0pw --id.type peer \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

fabric-ca-client register --caname ca-org1 \
    --id.name user1 --id.secret user1pw --id.type client \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

fabric-ca-client register --caname ca-org1 \
    --id.name org1admin --id.secret org1adminpw --id.type admin \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 \
    --caname ca-org1 \
    -M ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org1.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/config.yaml

fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 \
    --caname ca-org1 \
    -M ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls \
    --enrollment.profile tls \
    --csr.hosts peer0.org1.example.com \
    --csr.hosts localhost \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/tlscacerts/* \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
cp ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/signcerts/* \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.crt
cp ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/keystore/* \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.key
mkdir -p ${ORGS_DIR}/peerOrganizations/org1.example.com/msp/tlscacerts
cp ${ORGS_DIR}/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/tlscacerts/* \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/msp/tlscacerts/tlsca-org1.pem

fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 \
    --caname ca-org1 \
    -M ${ORGS_DIR}/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org1.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/config.yaml

fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 \
    --caname ca-org1 \
    -M ${ORGS_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org1/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org1.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/config.yaml

# ─── Org2 ───────────────────────────────────────────────────────
echo "📋 Enrolling Org2 CA admin..."
mkdir -p ${ORGS_DIR}/peerOrganizations/org2.example.com/msp

export FABRIC_CA_CLIENT_HOME=${ORGS_DIR}/peerOrganizations/org2.example.com

fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 \
    --caname ca-org2 \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: orderer' > ${ORGS_DIR}/peerOrganizations/org2.example.com/msp/config.yaml

fabric-ca-client register --caname ca-org2 \
    --id.name peer0 --id.secret peer0pw --id.type peer \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

fabric-ca-client register --caname ca-org2 \
    --id.name user1 --id.secret user1pw --id.type client \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

fabric-ca-client register --caname ca-org2 \
    --id.name org2admin --id.secret org2adminpw --id.type admin \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 \
    --caname ca-org2 \
    -M ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org2.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp/config.yaml

fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 \
    --caname ca-org2 \
    -M ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls \
    --enrollment.profile tls \
    --csr.hosts peer0.org2.example.com \
    --csr.hosts localhost \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/tlscacerts/* \
    ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
cp ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/signcerts/* \
    ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/server.crt
cp ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/keystore/* \
    ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/server.key
mkdir -p ${ORGS_DIR}/peerOrganizations/org2.example.com/msp/tlscacerts
cp ${ORGS_DIR}/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/tlscacerts/* \
   ${ORGS_DIR}/peerOrganizations/org2.example.com/msp/tlscacerts/tlsca-org2.pem
fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 \
    --caname ca-org2 \
    -M ${ORGS_DIR}/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org2.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp/config.yaml

fabric-ca-client enroll -u https://org2admin:org2adminpw@localhost:8054 \
    --caname ca-org2 \
    -M ${ORGS_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org2/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org2.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/config.yaml

# ─── Org3 ───────────────────────────────────────────────────────
echo "📋 Enrolling Org3 CA admin..."
mkdir -p ${ORGS_DIR}/peerOrganizations/org3.example.com/msp

export FABRIC_CA_CLIENT_HOME=${ORGS_DIR}/peerOrganizations/org3.example.com

fabric-ca-client enroll -u https://admin:adminpw@localhost:10054 \
    --caname ca-org3 \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-org3.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-org3.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-org3.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-org3.pem
    OrganizationalUnitIdentifier: orderer' > ${ORGS_DIR}/peerOrganizations/org3.example.com/msp/config.yaml

fabric-ca-client register --caname ca-org3 \
    --id.name peer0 --id.secret peer0pw --id.type peer \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

fabric-ca-client register --caname ca-org3 \
    --id.name user1 --id.secret user1pw --id.type client \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

fabric-ca-client register --caname ca-org3 \
    --id.name org3admin --id.secret org3adminpw --id.type admin \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 \
    --caname ca-org3 \
    -M ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org3.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/msp/config.yaml

fabric-ca-client enroll -u https://peer0:peer0pw@localhost:10054 \
    --caname ca-org3 \
    -M ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls \
    --enrollment.profile tls \
    --csr.hosts peer0.org3.example.com \
    --csr.hosts localhost \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/tlscacerts/* \
    ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
cp ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/signcerts/* \
    ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/server.crt
cp ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/keystore/* \
    ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/server.key
mkdir -p ${ORGS_DIR}/peerOrganizations/org3.example.com/msp/tlscacerts
cp ${ORGS_DIR}/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/tlscacerts/* \
   ${ORGS_DIR}/peerOrganizations/org3.example.com/msp/tlscacerts/tlsca-org3.pem
fabric-ca-client enroll -u https://user1:user1pw@localhost:10054 \
    --caname ca-org3 \
    -M ${ORGS_DIR}/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org3.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp/config.yaml

fabric-ca-client enroll -u https://org3admin:org3adminpw@localhost:10054 \
    --caname ca-org3 \
    -M ${ORGS_DIR}/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/org3/tls-cert.pem

cp ${ORGS_DIR}/peerOrganizations/org3.example.com/msp/config.yaml \
    ${ORGS_DIR}/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/config.yaml

# ─── Orderer ────────────────────────────────────────────────────
echo "📋 Enrolling Orderer CA admin..."
mkdir -p ${ORGS_DIR}/ordererOrganizations/example.com/msp

export FABRIC_CA_CLIENT_HOME=${ORGS_DIR}/ordererOrganizations/example.com

fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 \
    --caname ca-orderer \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/orderer/tls-cert.pem

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > ${ORGS_DIR}/ordererOrganizations/example.com/msp/config.yaml

fabric-ca-client register --caname ca-orderer \
    --id.name orderer --id.secret ordererpw --id.type orderer \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/orderer/tls-cert.pem

fabric-ca-client register --caname ca-orderer \
    --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/orderer/tls-cert.pem

fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 \
    --caname ca-orderer \
    -M ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/orderer/tls-cert.pem

cp ${ORGS_DIR}/ordererOrganizations/example.com/msp/config.yaml \
    ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml

fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 \
    --caname ca-orderer \
    -M ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls \
    --enrollment.profile tls \
    --csr.hosts orderer.example.com \
    --csr.hosts localhost \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/orderer/tls-cert.pem

cp ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* \
    ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
cp ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/* \
    ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
cp ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/* \
    ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

mkdir -p ${ORGS_DIR}/ordererOrganizations/example.com/msp/tlscacerts
cp ${ORGS_DIR}/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* \
    ${ORGS_DIR}/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 \
    --caname ca-orderer \
    -M ${ORGS_DIR}/ordererOrganizations/example.com/users/Admin@example.com/msp \
    --tls.certfiles ${ORGS_DIR}/fabric-ca/orderer/tls-cert.pem

cp ${ORGS_DIR}/ordererOrganizations/example.com/msp/config.yaml \
    ${ORGS_DIR}/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml

echo "🎉 Crypto material generated successfully!"

