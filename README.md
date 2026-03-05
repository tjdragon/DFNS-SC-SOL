# 🏦 Solana Cross-Border Payment System (Stablecoin Swap)

🛡️ **Secure. Non-Custodial. Atomic.**

This project implements a secure, non-custodial cross-border payment system on Solana. It leverages **DFNS** for secure transaction signing via KMS and **Anchor** for robust on-chain logic.

The system facilitates **Atomic Swaps** between stablecoins (e.g., tEUR to tSGD), ensuring that the sender's funds are only burned if the receiver's funds are successfully minted.

---

## 🏗️ Technical Stack

- **On-Chain**: Solana (Rust/Anchor)
- **Security**: DFNS (Key Management System & Transaction Broadcasting)
- **Local Dev**: Node.js v18+, TypeScript (tsx)
- **Environment**: Developed and verified on **Ubuntu Linux**.
  > [!NOTE]  
  > Users on macOS or Windows (WSL recommended) might need to adjust certain pathing or system dependencies for the Solana CLI and Anchor toolchain.

---

## ⚙️ Setup & Configuration

### 1. Prerequisites
- [DFNS Account](https://dfns.io/) and API credentials.
- Solana CLI & Anchor (v0.30+).

### 2. Environment Variables
Create a `dfns/.env` file with the following structure. These secrets are required for both deployment and the automated payment flow:

```env
DFNS_API_URL='https://api.dfns.io'
DFNS_ORG_ID='your-org-id'
DFNS_CRED_ID='your-cred-id'
DFNS_PRIVATE_KEY='-----BEGIN PRIVATE KEY...-----'
DFNS_AUTH_TOKEN='your-auth-token'
BANK_WALLET_ID='wa-...'  # The wallet acting as Mint Authority and Sender
```

---

## 🚀 Deployment Guide

### 1. Build the Program
The core logic resides in `programs/cross-border-payment`.
```bash
anchor build
```

### 2. Secure Deployment via DFNS
This method uses your DFNS wallet for the deployment, keeping the program's upgrade authority secure in the KMS.
```bash
# Sync local keys with the program ID before deploying
anchor keys sync
npx tsx dfns/DeployProgram.ts
```

---

## 💎 Solana Cross-Border Payment System Demo using DFNS

This demo showcases a real-world transaction flow on **Solana Devnet**.

### 🌍 Demo Identities
- **🏦 Bank Wallet (Sender)**: `GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS`
- **👤 Receiver Address**: `4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa`

### 💰 Stablecoin Asset Registry
- 💶 **tEUR**: `H4WRimGyS4iXaybe87HKuE3ZWRuFvMonUr5STNWXTBUN`
- 🇸🇬 **tSGD**: `8iRgQcRDqMWyHRyWzDUGPHkJmveGpDeRnWMCvji6Noqw`

---

### 🔄 The Three-Step Payment Flow

#### 1️⃣ Step: Initialize Payment
Creates a unique Payment PDA on-chain to track the state.
```bash
npx tsx dfns/InitPayment.ts 3 4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa 50000
```
- **PDA**: `D71N3p2mf5UdcUCzpQbby3VzWa6rHeDQmPnau4xeyFyE`
- **Transaction**: [View on Explorer](https://explorer.solana.com/tx/5vHK68WjZL45UPD9TXxDjYJWaxC8Cz18NPFbJ6aCfbvL1FBdRx618QpAyo758wk1fF68LCyiEGh5yG9Pkuj8JLLx?cluster=devnet)

#### 2️⃣ Step: Set FX Rate
An authorized entity locks in the exchange rate for the receiver.
```bash
npx tsx dfns/SetFXRate.ts 3 GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS 60000
```
- **Status Change**: `PendingFX` -> `FXRateSet`
- **Transaction**: [View on Explorer](https://explorer.solana.com/tx/2BeHK919xeuSseXHoJ9CiW6XERShu1vjqMyHHPhjLUqL69duvpPu8rTnjpqMTpu4SA1NJodW2qKTKgmcvVzk6HEy?cluster=devnet)

#### 3️⃣ Step: Atomic Execution
The final swap. **tEUR** is burned from the sender, and **tSGD** is minted to the receiver.
```bash
npx tsx dfns/ExecutePayment.ts 3
```
- **Receiver ATA Verification**: The script automatically detects if the receiver needs a token account and initializes it atomically.
- **Security**: The program validates that the minted tokens *must* go to the receiver defined during Step 1.
- **Transaction**: [View on Explorer](https://explorer.solana.com/tx/2z7JxeWq43i4gRFEStdJcdqS87NxkzxmFNCpsVbRo5NfUNg3HfQP8dPtfqUSgdFkFz79GrCX2n6RoFrXJsLC3gfG?cluster=devnet)

---

### ✅ Verification
You can audit the effects by checking the token balances on the explorer:
- **💶 Sender (Bank)**: [Check tEUR reduction](https://explorer.solana.com/address/GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS/tokens?cluster=devnet)
- **🇸🇬 Receiver**: [Check tSGD increase](https://explorer.solana.com/address/4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa/tokens?cluster=devnet)

---
*Built with ❤️ using [DFNS](https://dfns.io/) and Solana.*
