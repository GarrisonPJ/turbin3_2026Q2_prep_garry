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
   Ensure your `.env` contains the following keys. `WBA_VAULT_PROGRAM_ID` is critical for Phase 3.
   ```env
   SOLANA_RPC_URL="https://api.devnet.solana.com"
   WBA_VAULT_PROGRAM_ID="D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o"
   NFT_IMAGE_PATH="./cluster1/coin.png"
   NFT_MINT_ADDRESS="<set after nft_mint>"
   ```

3. **Execution**:
   Run scripts step-by-step, or use the regression runner:
   ```bash
   npm run cluster1_regression
   ```

## Recommended Sequence

```bash
# SPL
npm run spl_init
npm run spl_mint
npm run spl_transfer
npm run spl_metadata

# NFT
npm run nft_image
npm run nft_metadata
npm run nft_mint

# Vault (SOL/SPL/NFT)
npm run vault_init
npm run vault_deposit
npm run vault_withdraw
npm run vault_deposit_spl
npm run vault_withdraw_spl
npm run vault_deposit_nft
npm run vault_withdraw_nft
npm run vault_close
```

## Common Errors

- `fetch failed`: RPC/proxy connectivity issue. Use `scripts/run_with_proxy_fallback.sh <script>` to retry with proxy off.
- `Missing env: ...`: update `.env` (`NFT_MINT_ADDRESS`, `WBA_VAULT_STATE`, etc.) before running dependent scripts.
- `custom program error: 0x1` / `insufficient funds`: state or balance precondition issue (not usually a client mapping bug).
