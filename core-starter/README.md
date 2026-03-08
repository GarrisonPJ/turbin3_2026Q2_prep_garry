# Turbin3 2026 Q2 - Cluster 1 (Core Starter)

> **"Client First" Architecture**: Before we forge the Vault in Rust, we must learn to hack the Vault via TypeScript.

This repository contains the implementation of the Turbin3 Cluster 1 assignments. It serves as the primary battleground for mastering Solana's client-side primitives, moving away from simple interactive scripts towards robust protocol interactions.

## Architecture Philosophy: Agile Scripting (Option B)

Unlike the `pre-builders` phase which focused on enterprise-grade RPC fallback engines, this repository adopts an **Agile Scripting** approach. 

We deliberately omit heavy HOF (Higher-Order Function) wrappers like `executeWithFallback` to minimize cognitive load and cognitive boilerplate. Instead, we heavily leverage `.env` dependency injection. Focusing 100% on how `Mint`, `ATA`, and `PDA` derivations work under the hood.

## Purified Directory Structure

Historical "toy scripts" (`tools/`, `prereqs/`) and outdated IDLs have been surgically removed to maintain strict workspace hygiene.

```text
core-starter/
├── cluster1/                    # The main battlefield
│   ├── programs/wba_vault.ts    # The Boss: Vault IDL (Anchor)
│   ├── spl_*.ts                 # Phase 1: SPL Fungible Tokens
│   ├── nft_*.ts                 # Phase 2: NFTs & Metaplex Umi
│   └── vault_*.ts               # Phase 3: Anchor CPI & PDA Derivation
├── .env                         # Centralized network & program config
├── turbin3-wallet.json          # Devnet wallet (Migrated from pre-builders)
├── package.json                 
└── tsconfig.json
```

## The Three Core Battles

### Phase 1: SPL Tokens (Fungible)
Mastering the `@solana/spl-token` library.
- **Mint vs Token Account**: Understanding the difference between the token "factory" and the user "wallet".
- **ATA (Associated Token Account)**: Learning deterministically derived token accounts.

### Phase 2: NFTs (Non-Fungible via Umi)
Transitioning from standard `web3.js` to Metaplex's `@metaplex-foundation/umi` framework.
- **Decentralized Storage**: Uploading assets to Irys/Arweave.
- **Metadata Standard**: Formatting and attaching JSON metadata to on-chain tokens.

### Phase 3: Vault CPI (Anchor Program Interaction)
Interacting with a black-box Rust contract (`wba_vault`) purely via its IDL.
- **PDA Derivation**: Manually calculating deterministic `seeds` and `bumps` (e.g., `vaultAuth`, `vaultState`) using `findProgramAddressSync`.
- **Instruction Construction**: Correctly mapping `isSigner` and `isMut` accounts into Anchor's `.accounts()` API.

## Setup & Configuration

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables (`.env`)**:
   Ensure your `.env` contains the following keys. The `VAULT_PROGRAM_ID` is critical for Phase 3.
   ```env
   SOLANA_RPC_URL="https://api.devnet.solana.com"
   VAULT_PROGRAM_ID="D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o"
   ```

3. **Execution**:
   Run the scripts sequentially using the provided npm commands, for example:
   ```bash
   npm run spl_init
   ```
