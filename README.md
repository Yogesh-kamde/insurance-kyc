# Insurance KYC Platform on Hyperledger Fabric

A full-stack enterprise blockchain application for insurance KYC verification, policy management, and claims processing, built on a **3-organization Hyperledger Fabric network** with **Go chaincode**, a **Node.js backend**, and a **React frontend**.

---

## 🏗️ Architecture

React Frontend (5 Role-based Portals)
↓ HTTP (Axios) + HttpOnly Cookies
Node.js + Express Backend (Fabric Gateway SDK, JWT auth, WebSockets)
↓ gRPC
Hyperledger Fabric Network (Go Chaincode)
Org1: Insurer → IssuePolicy, FileClaim
Org2: Regulator → VerifyKYC
Org3: Claims Assessor → AssessClaim
↕
MongoDB Atlas — off-chain storage, synced with ledger state


---

## 🔄 Workflow
Customer registers → KYCStatus: PENDING (blockchain + MongoDB)
Regulator reviews KYC → approves/rejects
Insurer issues policy → requires KYCStatus = APPROVED, auto-generated policy ID
Insurer files a claim → auto-generated claim ID
Claims Assessor reviews → approves/rejects the claim
Payout Officer processes → marks claim as PAID

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Hyperledger Fabric v2.5, 3-org network, Raft orderer |
| Chaincode | Go (Golang) |
| Backend | Node.js + Express, Socket.io, JWT |
| Fabric SDK | `@hyperledger/fabric-gateway` |
| Frontend | React.js, Axios |
| Off-chain DB | MongoDB Atlas |
| Infra | Docker, Docker Compose |
| Testing | Go testify, Jest, Supertest |
| Deployment | nginx, Cloudflare Tunnel |

---

## 📁 Project Structure

insurance-kyc/
├── chaincode/
│   ├── kyc.go              # Smart contract (8 functions, 3 structs)
│   ├── kyc_test.go         # Go unit tests
│   └── go.mod
├── backend/
│   ├── app.js               # Express app (routes, middleware)
│   ├── server.js            # Entry point (listen, Socket.IO, DB connect)
│   ├── seed.js               # Test data seeder
│   ├──__tests__/                # Jest/Supertest route tests
│   ├── middleware/
│   │   ├── auth.js          # JWT + HttpOnly cookie auth
│   │   ├── validate.js      # Input validation
│   │   └── rateLimiter.js   # express-rate-limit config for auth routes
│   ├── models/               # User, Customer, Policy, Claim
│   ├── routes/
│   │   └── auth.js          # register + login
│   ├── utils/
│   │   ├── fabric.js        # Fabric Gateway connection (configurable via .env)
│   │   └── db.js            # MongoDB connection
│   └── .env                  # not committed — see Setup
├── frontend/
│   └── src/
│       ├── App.js
│       └── pages/
│           ├── CustomerPortal.js
│           ├── RegulatorDashboard.js
│           ├── InsurerDashboard.js
│           ├── AssessorDashboard.js
│           └── PayoutDashboard.js
├── network/                  # Custom Docker Compose Fabric network
│   ├── network.sh            # up / down / restart
│   ├── configtx.yaml         # orgs, policies, anchor peers
│   ├── docker-compose.yml    # 3 peers, orderer, 4 CAs, CLI
│   └── scripts/
│       ├── upgradeCC.sh      # Chaincode version upgrades
│       ├── registerEnroll.sh # crypto material generation
│       └── setup.sh          # channel + chaincode setup
├── start.sh                  # Bring up the full stack (network + backend + nginx + tunnel)
└── README.md

## ⛓️ Chaincode Functions

| Function | Org | Description |
|----------|-----|-------------|
| `RegisterCustomer` | Any | Register a new customer with `KYCStatus = PENDING` |
| `VerifyKYC` | Regulator | Approve or reject customer KYC |
| `GetCustomer` | Any | Read customer data from the ledger |
| `IssuePolicy` | Insurer | Issue a policy (requires `KYCStatus = APPROVED`) |
| `GetPolicy` | Any | Read policy data from the ledger |
| `FileClaim` | Insurer | File a claim against a policy |
| `AssessClaim` | Claims Assessor | Approve or reject a filed claim |
| `ProcessPayout` | Payout Officer | Marks an assessed claim as paid |

Each write follows a standard 5-step pattern: Read → Unmarshal → Modify → Marshal → Write.

---

## 🚀 Getting Started

### Prerequisites
- Docker + Docker Compose
- Go 1.18+ (for chaincode)
- Node.js v18+
- A MongoDB Atlas cluster (or local MongoDB)
- WSL2 (Ubuntu) on Windows, or Linux

### 1. Configure environment variables

**`backend/.env`**

PORT=3000
CHANNEL_NAME=insurancechannel
CHAINCODE_NAME=kyc
MSP_ID=Org1MSP
PEER_ENDPOINT=localhost:7051
PEER_ENDPOINT_ORG2=localhost:9051
PEER_ENDPOINT_ORG3=localhost:11051
PEER_HOST_ALIAS=peer0.org1.example.com
JWT_SECRET=<your-secret>
MONGODB_URI=<your-mongodb-uri>
NETWORK_ORG_PATH=/absolute/path/to/insurance-kyc/network/organizations


**`frontend/.env`**

PORT=3001


Neither file is committed — create them yourself using the templates above.

### 2. Start the Fabric Network

The network is fully self-contained — no dependency on `fabric-samples/test-network`.

```bash
cd network
./network.sh up
```

This starts 3 peers, an orderer, and 4 CAs; generates crypto material; creates the channel via the channel participation API; and packages, installs, approves, and commits the chaincode automatically. Wait for `🎉 Network is up!`.

To rebuild from a clean state:
```bash
./network.sh down
sudo rm -rf organizations config/*.block
./network.sh up
```
This wipes the ledger — reseed afterward.

### 3. Seed test data (only after a fresh network)

```bash
cd backend
npm install
node seed.js
```

### 4. Start the Backend

```bash
cd backend
npm install
node server.js
# Server runs on http://localhost:3000
```

### 5. Start the Frontend

```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3001
```

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register a new customer |
| POST | `/auth/login` | Log in (returns role, sets HttpOnly cookie) |
| POST | `/auth/logout` | Log out |
| GET | `/customer/:customerID` | Get customer details |
| POST | `/kyc/verify` | Approve or reject KYC (Regulator) |
| POST | `/policy/issue` | Issue a policy (Insurer) |
| GET | `/policy/:policyId` | Get policy details |
| POST | `/claim/file` | File a claim (Insurer) |
| POST | `/claim/assess` | Approve or reject a claim (Assessor) |
| POST | `/claim/payout` | Process payout (Payout Officer) |
| GET    | /health              | Health check (no auth) |

---

## 👤 Role-based Portals

- **Customer Portal** — Register, check KYC status, view policies
- **Regulator Dashboard** — Review and approve/reject pending KYC
- **Insurer Dashboard** — Issue policies, file claims
- **Assessor Dashboard** — Review and approve/reject filed claims
- **Payout Dashboard** — Process payouts for assessed claims

---

## 🔑 Test Accounts

| Username | Password | Role |
|---|---|---|
| customer1 | pass123 | Customer |
| regulator1 | pass123 | Regulator |
| insurer1 | pass123 | Insurer |
| assessor1 | pass123 | Claims Assessor |
| payout1 | pass123 | Payout Officer |

Seed accounts only — change credentials before any real deployment.

---

## ⚙️ Notes on the Fabric Network

- Uses Fabric's **channel participation API** (`osnadmin`), not the legacy system-channel flow — no `fabric-samples/test-network` dependency.
- Anchor peers are defined directly in `configtx.yaml` and baked into the genesis block; no separate anchor-peer update step is needed.
- CA containers run as the host user (`user: "${HOST_UID}:${GID}"` in `docker-compose.yml`) to avoid root-owned bind-mount permission issues.
- The backend connects to peers via `localhost:<port>` from the host, with `peerHostAlias` set to each peer's Docker-internal hostname for TLS certificate verification.

---

## 📌 Status

✅ **Complete** — 3-org network with per-org transaction routing (each role submits transactions under its own org's identity), chaincode deployed and committed, all 5 dashboards, JWT auth with rate-limited auth routes, MongoDB sync, WebSocket notifications, Go + Jest test suites, `/health` endpoint, live deployment via nginx + Cloudflare Tunnel.
  cd chaincode
  go test ./... -v
```
- **Backend**: 26 Jest/Supertest tests (`backend/__tests__/`) covering auth, validation, and success paths for every write route, plus rate-limiting enforcement on `/auth/login`, with the Fabric Gateway and MongoDB fully mocked so tests run without the network or a database.
```bash
  cd backend
  npm test
```

## 🌐 Deployment

The full stack (Fabric network, backend, MongoDB, and the React build) runs locally and is exposed publicly through nginx (serving the frontend build and reverse-proxying API routes to the backend on one origin) and a Cloudflare Tunnel.

**Live demo:** https://your-tunnel-url-here *(up while the host machine is running `start.sh`)*

```bash
./start.sh
```

This brings the Fabric network up (rebuilding from a clean state if it isn't already running), starts the backend, ensures nginx is running, and opens a Cloudflare Tunnel — printing the public HTTPS URL at the end.

> Note: this is a laptop-hosted deployment — the public URL is only live while the host machine is running `start.sh`'s processes. A full rebuild also resets the ledger, since the network scripts aren't currently idempotent.

## 👨‍💻 Author

**Yogesh Kamde**
- GitHub: [Yogesh-kamde](https://github.com/Yogesh-kamde)
- Email: yogeshkamde90@gmail.com
- PG Diploma in Fintech and Blockchain — CDAC Patna (2023)

---

## 📄 License

MIT License
