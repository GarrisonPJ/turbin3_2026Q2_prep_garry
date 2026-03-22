2026/2/27
rewrote /pre-builder/typescript/keygen.ts . Removed 2 functions of Base58 code conversion. left one function for checking existed wallet or generating a new one.

2026/2/27
rewrote pre-builders/typescript/airdrop.ts. Reduced redundant RPC calls by using latestBlockhash.lastValidBlockHeight, lowered airdrop amount to 1 SOL, improved terminal output formatting, and added basic RPC fallback retry to handle devnet instability.

2026/2/28
rewrote pre-builders/typescript/transfer.ts. upgraded to VersionedTransaction (V0) and added ComputeBudgetProgram for priority fees. replaced `.pop()` with array replacement for exact fee calculation. fixed RPC fetch failed errors by switching to Ankr node.

2026/3/1
rewrote pre-builders/typescript/enroll.ts. Removed redundant `.signers([keypair])` as AnchorProvider handles auto-signing. Omitted manual `prereq` (PDA) and `systemProgram` declarations, allowing IDL metadata to resolve them automatically.

2026/3/1
rewrote pre-builders/typescript/airdrop.ts, pre-builders/typescript/transfer.ts, and pre-builders/typescript/enroll.ts. Switched RPC configuration to project-level `.env` (primary + fallback endpoints) and added related safety validations (empty config guard, retryable error handling, and post-success early return to avoid duplicate submissions) with AI assisting and code-reviewing.

2026/3/2
refactored pre-builders/typescript/transfer.ts and pre-builders/typescript/enroll.ts to align with the defensive programming standard of airdrop.ts. Fixed a critical control flow bug (infinite balance drain loop) by enforcing strict early `return` upon transaction confirmation. Flattened redundant nested retry loops into a unified, single-layer RPC fallback architecture,
resolving scope traps with `continue` to properly cycle endpoints
on transient network errors.

2026/3/3
Architected Rust implementation. split the original `lib.rs` into 5 modules. New `lib.rs` for claiming crates, `wallet.rs` for loading wallet, `config.rs` for centralized environment management and `types.rs` for manual Anchor discriminator payload construction. Structured `solana_ops.rs` into a stateful client engine(Partly implemented).

2026/3/4
Completed `solana_ops.rs`. Manually derived PDAs, constructed `AccountMeta` permission arrays, and packed CPI instructions into Agave 3.0 `VersionedTransaction` (v0). Resolved Rust borrow checker lifetime traps using explicit variable bindings. Separated execution flow into `tests/integration.rs` using `#[ignore]` flags for secure RPC E2E testing. Solana runtime state locks (`already in use`) caused by previously initialized PDAs, indicating the code is functioning. Deleted auto-generated client bindings (`src/programs/`) in favor of a 100% manual CPI architecture.

2026/3/5
Extracted nested, imperative RPC retry loops from `airdrop.ts`, `transfer.ts`, and `enroll.ts` into a unified `utils/rpc.ts` utility layer. Implemented a Higher-Order Function (`executeWithFallback`) featuring a "Blacklist" Error Discriminator to enforce Fail-Fast behavior on errors while retrying transient network drops. Refactored all three scripts into declarative, DRY architectures while preserving Agave 3.0 primitives and Anchor 0.30+ automatic PDA resolution.

2026/3/6
Implemented deep error downcasting in Rust `tests/integration.rs`, unwrapping `ClientError` chains to gracefully catch `already in use` protocol errors without panicking. Resolved directory fragmentation by enforcing a highly cohesive architecture, unifying `.env` and `dev-wallet.json` at the `pre-builders/` root folder. And some other changes are made. `pre-builders` folder end here so far.

2026/3/7
Conducted comprehensive code review remediation. Fixed RPC retry semantics by correctly classifying transient network failures. Secured key generation by removing plaintext secret key logging. Extracted hardcoded variables (GitHub handle, transfer target) into `.env`. Engineered rent-exemption preservation logic in `transfer.ts` to prevent account purging. Added idempotent error handling in TS. Strengthened Rust architecture by injecting `WALLET_PATH` to eliminate fragile dependencies, and introduced TDD unit tests for `Config` loading and Anchor instruction discriminator encoding. Applied workspace-wide linting and formatting.

2026/3/8
Finished review and other improvements. Upgraded error classification from fragile string-matching to strict native typing (SendTransactionError). Eliminated keygen console vulnerability by securely parsing and outputting only the public key. Unified telemetry across both languages with standard log levels ([INFO], [WARN], [ERROR]) and actionable prompts. Rewrote Rust integration tests to natively parse `0x0` idempotency states into graceful closures, reinforced by >64 byte Base58 signature assertions. Injected a lightweight native `tests.ts` baseline bound to `npm run test` and aligned README deployment specifications.

2026/3/11
 Haven't done a thing in the past 2days due to my PC is broken,took some time to set a new one and other stuffs. Anyway,finished `spl_init.ts` to initialize a new SPL Token Mint on Devnet, applying `.env` dependency injection for Helius RPC nodes. Completed `spl_mint.ts` by implementing the Associated Token Account (ATA) derivation pattern. Successfully minted 100 tokens to a local ATA using `getOrCreateAssociatedTokenAccount` and `mintTo`, handling 6-decimal precision with native BigInt math.

 2026/3/12
 Implemented `spl_transfer.ts` to perform cross-wallet token transfers. Grepd the indirection between System Wallet Addresses and Associated Token Accounts (ATA), utilizing `getOrCreateAssociatedTokenAccount` to ensure recipient liquidity and executing the transfer with 6-decimal BigInt precision. Verified the transaction on Solana Explorer. 

2026/3/15
Completed `spl_metadata.ts` migration to Umi/Metaplex flow. Implemented `createV1` metadata creation for fungible token use-case, added mint-authority preflight validation via on-chain mint fetch (`getMint`), and enforced creator share invariants for multi-creator extension safety. Replaced env-based Base58 secret dependency with local `turbin3-wallet.json` key material (`Uint8Array`) to match existing cluster scripts; kept `bs58` only for transaction signature encoding required by Solana Explorer URL output. Hardcoded temporary `tokenSymbol`/`tokenUri` placeholders for iterative testing.

2026/3/16
Completed `nft_image.ts` under Umi + Irys workflow. Implemented local image loading, MIME inference from extension, `createGenericFile` conversion, and `umi.uploader.upload` flow to output image URI for downstream metadata minting. Fixed functional API misuse (`umi.uploader` callable error) and corrected runtime path resolution (`ENOENT`) by aligning file path with script execution root. Current blocker confirmed as external environment/infrastructure instability rather than business logic: local proxy introduced HTTP/HTTPS mismatch, and after isolation the Irys devnet endpoint returned transient `503` service availability failures.

2026/3/17
Completed `nft_metadata.ts` end-to-end using the image URI generated from `nft_image.ts`. Standardized environment key usage around `NFT_IMAGE_URI`, Resolved repeated runtime connectivity issues by executing upload commands with proxy variables unset for the session, then successfully produced metadata URI for downstream `nft_mint.ts` consumption.

2026/3/18
Completed `vault_init.ts`. Resolved `Program` initialization incompatibilities caused by legacy generated IDL shape (`address/types/accounts/instructions` expectations in `@coral-xyz/anchor@0.31.x`) by adding a lightweight runtime normalization layer for the local IDL (legacy `publicKey` type mapping, account/instruction discriminator injection, and account name normalization). Verified PDA derivation flow (`vaultState` -> `vaultAuth` -> `vault`).

2026/3/19
Completed `vault_deposit.ts` with the same Anchor 0.31 compatibility strategy used in `vault_init.ts` (legacy IDL normalization, signer/writable mapping, and discriminator injection). Reused recorded `vaultState` to deterministically derive `vaultAuth` and `vault`, then executed `deposit` using lamports-denominated `BN` input. Verified deposit correctness by comparing owner/vault balances before and after transaction confirmation under the stabilized Node runtime proxy configuration.

2026/3/20
Completed `vault_withdraw.ts` by reusing the same Anchor 0.31 legacy-IDL compatibility layer and deterministic PDA derivation flow (`vaultState` -> `vaultAuth` -> `vault`) from deposit/init scripts. Validated compile/runtime wiring and account mapping, then diagnosed withdrawal failure (`custom program error: 0x1`) as expected state-level insufficiency (`vault` lamports = 0 while attempting 10_000_000 lamports transfer). 

2026/3/21
Completed `vault_close.ts` and resolved `InstructionFallbackNotFound (101)` by aligning instruction discriminator derivation with snake_case normalization for camelCase IDL names (`closeAccount` -> `close_account`) under the existing Anchor 0.31 legacy-IDL compatibility layer.

2026/3/22
Completed `vault_deposit_spl.ts` to a runnable structure under the same Anchor 0.31 legacy-IDL compatibility approach.
