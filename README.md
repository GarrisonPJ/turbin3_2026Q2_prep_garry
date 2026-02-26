# Turbin3 2026 Q2 Builder's Cohort — Preparation

My preparation repository for the [Turbin3](https://turbin3.com) 2026 Q2 Solana Builder's Cohort. This repo consolidates prerequisite exercises, Solana fundamentals, and Anchor on-chain program studies into a progressive learning path.

## Repository Structure

```
├── pre-builders/            Enrollment prerequisites
│   ├── rust/                Keygen → Airdrop → Transfer → Enroll (Rust)
│   └── typescript/          Keygen → Airdrop → Transfer → Enroll (TypeScript)
│
├── core-starter/            Solana fundamentals
│   └── typescript/          SPL Token, NFT minting, Metaplex operations
│
└── advanced-projects/       Anchor on-chain programs
    ├── vault/               SOL vault with PDA signing
    ├── escrow/              Token escrow (make / take / refund)
    ├── amm-program/         Automated Market Maker
    ├── dice/                On-chain randomness
    ├── marketplace/         NFT marketplace
    ├── staking/             Token staking
    └── nft-metaplex/        Metaplex Core NFT
```

## Acknowledgments

This repository incorporates and builds upon code from the following open-source repositories, all part of the [Turbin3 Q1 2025 Builder's Cohort](https://turbin3.com) curriculum:

| Source | Forked From | Original Author | License |
|--------|-------------|-----------------|---------|
| [Q1_25_Builder_dvrvsimi](https://github.com/solana-turbin3/Q1_25_Builder_dvrvsimi) | [solana-turbin3](https://github.com/solana-turbin3) | [@dvrvsimi](https://github.com/dvrvsimi) | MIT |
| [solana-starter](https://github.com/solana-turbin3/solana-starter) | [solana-turbin3](https://github.com/solana-turbin3) | Turbin3 | — |
| [TURBIN3-Q1-25](https://github.com/brianobot/TURBIN3-Q1-25) | [@brianobot](https://github.com/brianobot) | [@brianobot](https://github.com/brianobot) | — |

Specifically:
- **`pre-builders/`** — derived from the Q1 2025 cohort prerequisite exercises
- **`core-starter/`** — derived from [`solana-turbin3/solana-starter`](https://github.com/solana-turbin3/solana-starter)
- **`advanced-projects/`** — derived from [@brianobot](https://github.com/brianobot)'s cohort work ([`TURBIN3-Q1-25`](https://github.com/brianobot/TURBIN3-Q1-25)), reorganized and studied as reference implementations

All original authors retain their respective copyrights. Code has been reorganized, cleaned up, and annotated for personal study purposes.

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) + Cargo
- [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor](https://www.anchor-lang.com/docs/installation) (for advanced-projects)
- [Node.js](https://nodejs.org/) 18+ & Yarn

### Quick Start

```bash
# Pre-builders (Rust)
cd pre-builders/rust
cargo test keygen -- --nocapture

# Pre-builders (TypeScript)
cd pre-builders/typescript
yarn install
npx ts-node keygen.ts

# Advanced projects (e.g. vault)
cd advanced-projects/vault
anchor build
anchor test
```
