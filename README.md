# Insurance KYC Platform on Hyperledger Fabric

A full-stack enterprise blockchain application for insurance KYC verification and policy management, built on a **multi-organization Hyperledger Fabric network** with **Go chaincode**, **Node.js backend**, and **React frontend**.

---

## 🏗️ Architecture

```
React Frontend (3 Role-based Portals)
        ↓ HTTP (Axios)
Node.js + Express Backend (Fabric Gateway SDK)
        ↓ gRPC
Hyperledger Fabric Network (Go Chaincode)
  Org1: Insurer    → IssuePolicy, FileClaim, ProcessPayout
  Org2: Regulator  → VerifyKYC, ApproveOnboarding
        ↕
Ledger (LevelDB) — immutable on-chain records
```

---

## 🔄 Workflow

```
1. Customer registers → KYCStatus: PENDING
2. Regulator reviews and approves/rejects KYC
3. Insurer issues policy (only if KYC = APPROVED)
4. Customer files a claim
5. Insurer processes payout
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Hyperledger Fabric v2.5 |
| Chaincode | Go (Golang) |
| Backend | Node.js + Express |
| Fabric SDK | @hyperledger/fabric-gateway |
| Frontend | React.js |
| HTTP Client | Axios |
| Off-chain DB | MongoDB (planned) |

---

## 📁 Project Structure

```
insurance-kyc/
├── chaincode/          # Go chaincode
│   ├── kyc.go          # Smart contract (7 functions)
│   └── go.mod
├── backend/            # Node.js API server
│   ├── app.js          # Express routes
│   ├── utils/
│   │   └── fabric.js   # Fabric Gateway connection
│   └── .env
└── frontend/           # React application
    └── src/
        ├── App.js
        └── pages/
            ├── CustomerPortal.js
            ├── RegulatorDashboard.js
            └── InsurerDashboard.js
```

---

## ⛓️ Chaincode Functions

| Function | Org | Description |
|----------|-----|-------------|
| `RegisterCustomer` | Any | Register a new customer with KYCStatus = PENDING |
| `VerifyKYC` | Regulator | Approve or reject customer KYC |
| `GetCustomer` | Any | Read customer data from ledger |
| `IssuePolicy` | Insurer | Issue policy (requires KYC = APPROVED) |
| `GetPolicy` | Any | Read policy data from ledger |
| `FileClaim` | Any | File an insurance claim |
| `ProcessPayout` | Insurer | Process claim payout |

---

## 🚀 Getting Started

### Prerequisites
- Docker + Docker Compose
- Hyperledger Fabric v2.5 (fabric-samples)
- Go 1.18+
- Node.js v18+
- WSL2 (Ubuntu) on Windows or Linux

### 1. Start the Fabric Network

```bash
cd ~/hyperledger/fabric-samples/test-network
./network.sh down
./network.sh up -ca
./network.sh createChannel -c insurancechannel
```

### 2. Deploy the Chaincode

```bash
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

# Package
peer lifecycle chaincode package kyc.tar.gz \
  --path ~/hyperledger/insurance-kyc/chaincode \
  --lang golang --label kyc_1.0

# Install on Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install kyc.tar.gz

# Install on Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install kyc.tar.gz

# Approve and Commit (update CC_PACKAGE_ID from install output)
export CC_PACKAGE_ID=kyc_1.0:<your-package-id>

# Approve for both orgs and commit
# (see full deployment steps in docs)
```

### 3. Start the Backend

```bash
cd ~/hyperledger/insurance-kyc/backend
node app.js
# Server runs on http://localhost:3000
```

### 4. Start the Frontend

```bash
cd ~/hyperledger/insurance-kyc/frontend
npm start
# App runs on http://localhost:3001
```

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/customer/register` | Register a new customer |
| GET | `/customer/:customerID` | Get customer details |
| POST | `/kyc/verify` | Approve or reject KYC |
| POST | `/policy/issue` | Issue a policy |
| GET | `/policy/:policyId` | Get policy details |
| POST | `/claim/file` | File a claim |
| POST | `/claim/payout` | Process payout |

---

## 👤 Role-based Portals

- **Customer Portal** — Register and check KYC status
- **Regulator Dashboard** — Review and approve/reject KYC
- **Insurer Dashboard** — Issue policies, file claims, process payouts

---

## 👨‍💻 Author

**Yogesh Kamde**
- GitHub: [Yogesh-kamde](https://github.com/Yogesh-kamde)
- Email: yogeshkamde90@gmail.com
- PG Diploma in Fintech and Blockchain — CDAC Patna (2023)

---

## 📄 License

MIT License
