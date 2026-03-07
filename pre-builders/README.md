# Turbin3 2026 Q2 Prerequisite - Garry

A implementation of the Turbin3 Pre-Builders assignment. This repository goes beyond the basic requirements, integrating enterprise-grade resilience and Agave 3.0 standards into both TypeScript and Rust environments.

## Key Technical Highlights

- **Resilient RPC Engine (TypeScript)**: Custom `executeWithFallback` wrapper that provides automatic failover across multiple RPC nodes and intelligent retry mechanisms, gracefully filtering out non-retriable on-chain errors.
- **Deep Error Downcasting (Rust)**: Advanced `match` handling of `solana_client::client_error::ClientError`. It elegantly unwraps the `cause.chain()` to differentiate between fatal protocol errors (like `already in use`) and transient network timeouts.
- **Agave 3.0 Standard**: Implements `ComputeBudgetProgram` priority fees dynamically in the TS transfer script to ensure transactions land smoothly during network congestion.
- **High Cohesion Architecture**: Both the Rust and TypeScript environments cleanly share a single `.env` and `dev-wallet.json` configuration at the project root, strictly adhering to DRY principles without sacrificing module independence.

## 📂 Project Structure

```text
pre-builders/
├── dev-wallet.json        # Shared Devnet Keypair (Generated)
├── .env                   # Shared RPC Configuration
├── rust/                  # Rust Prereq Implementation
│   ├── src/               # Library logic & Config loading
│   └── tests/             # Integration tests & Enrollment
└── typescript/            # TypeScript Prereq Implementation
    ├── utils/             # Fallback RPC Engine
    └── *.ts               # Keygen, Airdrop, Transfer, Enroll
```

## 🛠️ Getting Started

### 1. Configuration
1. Clone this directory.
2. Copy `.env.example` to `.env`.
3. Fill in your preferred Solana Devnet RPC URLs in the `.env` file (the system supports up to 3 fallback nodes).

### 2. The TypeScript Track
Navigate to the `typescript` directory and install dependencies:
```bash
cd typescript
npm install
```

Execute the pipeline sequentially:
```bash
# 1. Generate a new keypair (saved to ../dev-wallet.json)
npx ts-node keygen.ts

# 2. Claim Devnet SOL via custom RPC fallback wrapper
npx ts-node airdrop.ts

# 3. Transfer SOL using Agave 3.0 Priority Fees and precise fee calculation
npx ts-node transfer.ts

# 4. Enroll into the Turbin3 PDA (Anchor IDL Interaction)
npx ts-node enroll.ts
```

### 3. The Rust Track
Navigate to the `rust` directory:
```bash
cd ../rust
```

The Rust environment automatically traverses the directory tree and reads the WALLET_PATH vatiable to locate the Keypair.

Execute the enrollment integration test:
```bash
# The --nocapture flag is required to view the detailed transaction signature
# or the deeply parsed error downcast logs (e.g., if the PDA is already in use).
cargo test -- --ignored --nocapture
```

## Security Note
The `.gitignore` is strictly configured to prevent the accidental commit of `.env` and `dev-wallet.json`.
