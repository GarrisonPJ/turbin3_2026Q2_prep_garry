2026/2/27
rewrote /pre-builder/typescript/keygen.ts . Removed 2 functions of Base58 code conversion. left one function for checking existed wallet or generating a new one.

2026/2/27
rewrote pre-builders/typescript/airdrop.ts. Reduced redundant RPC calls by using latestBlockhash.lastValidBlockHeight, lowered airdrop amount to 1 SOL, improved terminal output formatting, and added basic RPC fallback retry to handle devnet instability.

2026/2/28
rewrote pre-builders/typescript/transfer.ts. upgraded to VersionedTransaction (V0) and added ComputeBudgetProgram for priority fees. replaced `.pop()` with array replacement for exact fee calculation. fixed RPC fetch failed errors by switching to Ankr node.

2026/3/1
rewrote pre-builders/typescript/enroll.ts. Removed redundant `.signers([keypair])` as AnchorProvider handles auto-signing. Omitted manual `prereq` (PDA) and `systemProgram` declarations, allowing IDL metadata to resolve them automatically.
