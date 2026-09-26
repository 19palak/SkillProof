# SkillProof 🔐🎓

## Own Your Credentials. Prove Your Skills.

SkillProof is a decentralized credential platform that enables institutions
to issue trusted digital credentials and allows students and employers to
verify those credentials using blockchain technology.

---

# 🚀 Problem Statement

Traditional digital certificates and credentials can be difficult to verify
and may be vulnerable to modification, duplication, or loss.

Employers and institutions often need to rely on centralized systems or
manual verification.

SkillProof addresses this problem by providing a blockchain-based system
for issuing, storing, verifying, and revoking digital credentials.

---

# 💡 Solution

SkillProof provides a blockchain-based platform where:

- Institutions can issue digital credentials.
- Students can access their credentials.
- Employers can verify credentials using a Credential ID.
- Authorized issuers can revoke credentials when necessary.
- Certificate hashes can be used to verify document integrity.
- MetaMask wallets are used for blockchain interaction.

---

# ✨ Features

## 🎓 Credential Issuance

Authorized issuers can create credentials containing:

- Student wallet address
- Credential type
- Metadata URI
- Credential hash
- Issuer address
- Issue timestamp

## 👨‍🎓 Student Dashboard

Students can retrieve their credentials using their Credential ID.

## 🔍 Credential Verification

Employers can enter a Credential ID and verify whether a credential
is currently valid or revoked.

## 🚫 Credential Revocation

The credential issuer can revoke a previously issued credential.

## 🔐 Blockchain Verification

Credential information is stored and verified through a Solidity
smart contract.

## 👛 Wallet Integration

MetaMask is used to connect users to the blockchain application.

## 📄 Certificate Upload

Users can upload a certificate PDF through the application.

The application generates a SHA-256 hash of the uploaded certificate,
which can be used as a digital fingerprint for integrity verification.

---

# 🏗️ System Workflow

```text
┌──────────────────────┐
│ Institution / Issuer │
└──────────┬───────────┘
           │
           │ Issue Credential
           ↓
┌──────────────────────┐
│    SkillProof App    │
└──────────┬───────────┘
           │
           │ Credential Data
           ↓
┌──────────────────────┐
│   Smart Contract     │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│      Blockchain      │
└──────────┬───────────┘
           │
       ┌───┴───────────┐
       ↓               ↓
┌──────────────┐  ┌──────────────┐
│   Student    │  │   Employer   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ↓                 ↓
View Credential    Verify Credential
```

---

# 🛠️ Technology Stack

## Frontend

- React.js — User interface
- JavaScript — Application logic
- Vite — Frontend development and build tool
- CSS — Styling and responsive design

## Blockchain

- Solidity — Smart contract development
- Hardhat — Smart contract development, testing, and local blockchain
- Ethereum-compatible blockchain — Blockchain infrastructure
- MetaMask — Wallet connection and blockchain interaction
- Ethers.js — Frontend blockchain interaction
- Viem — Smart contract interaction and testing

## Backend

- Node.js — Backend runtime
- Express.js — Backend framework

## Storage & Verification

- IPFS Metadata URI — Credential metadata reference
- SHA-256 — Certificate/document fingerprint generation

## Development & Deployment

- VS Code — Development environment
- Git — Version control
- GitHub — Source code repository
- Vercel — Frontend deployment

---

# 📁 Project Structure

```text
SkillProof/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── contract.js
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── blockchain/
│   ├── contracts/
│   │   └── SkillProof.sol
│   ├── ignition/
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

# ⚙️ Installation and Setup

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- MetaMask
- VS Code

---

# 1. Clone the Repository

```bash
git clone https://github.com/19palak/SkillProof.git
cd SkillProof
```

---

# 2. Setup Blockchain

Open a terminal:

```bash
cd blockchain
```

Install dependencies:

```bash
npm install
```

Start the local Hardhat blockchain:

```bash
npx hardhat node
```

Keep this terminal running.

---

# 3. Deploy the Smart Contract

Open another terminal:

```bash
cd blockchain
```

Deploy the smart contract:

```bash
npx hardhat ignition deploy ignition/modules/SkillProof.ts --network localhost
```

After deployment, copy the deployed contract address and update it in:

```text
frontend/src/contract.js
```

---

# 4. Setup Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

# 5. Setup MetaMask

Connect MetaMask to the local Hardhat network.

Use:

```text
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

Import one of the development accounts generated by Hardhat if required.

> ⚠️ The private keys generated by Hardhat are for local development only.
> Never use them with real funds or a production wallet.

---

# 📜 Smart Contract

The main smart contract is:

```text
blockchain/contracts/SkillProof.sol
```

The smart contract supports:

- Issuer authorization
- Issuer revocation
- Credential issuance
- Credential retrieval
- Credential verification
- Credential revocation

---

# 🔄 Application Workflow

## 1. Connect Wallet

The user connects their MetaMask wallet.

## 2. Issue Credential

The authorized issuer enters:

- Student wallet address
- Credential type
- Metadata URI
- Credential hash

The issuer can also upload a certificate PDF.

The application generates a SHA-256 fingerprint for the uploaded certificate.

The credential is then recorded through the smart contract.

## 3. Student Dashboard

The student enters the Credential ID to retrieve their credential.

The dashboard displays the credential information stored on the blockchain.

## 4. Verify Credential

An employer can enter the Credential ID and verify whether the credential
is currently valid.

## 5. Revoke Credential

The issuer can revoke the credential when necessary.

Once revoked, the credential verification status changes accordingly.

---

# 🔐 Credential Verification

SkillProof uses blockchain data together with a certificate hash to help
verify credential integrity.

The credential contains information such as:

```text
Credential ID
Student Address
Issuer Address
Credential Type
Metadata URI
Certificate Hash
Issue Date
Revocation Status
```

The blockchain provides a tamper-resistant record of the credential data.

---

# 🎥 Demo





**[Watch the SkillProof Demo](https://youtu.be/GpUsHniKaSU?si=1EV4DdaLknrqLJ8C)**

---


> Note: The current blockchain prototype uses a local Hardhat network.
> A public blockchain/testnet deployment is required for public blockchain
> interaction.

---

# 📍 Smart Contract

Current development contract address:

```text
0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

> This address corresponds to a local Hardhat development deployment.
> It is not a public mainnet or public testnet contract.

---

# 🔮 Future Scope

Future improvements include:

- Public blockchain/testnet deployment
- Production IPFS storage for credential documents
- QR-code based credential verification
- Institution dashboards
- Employer dashboards
- Multiple credential formats
- NFT-based credentials
- On-chain credential history
- Mobile application
- Improved identity and access management

---


## Project Goal

To provide a decentralized and verifiable way for students to own and
prove their educational and professional credentials.

---

# 👥 Team


- Palak Jain
- Vedika Therokar
- **Name** — Role
- **Name** — Role

---

# 📄 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.
