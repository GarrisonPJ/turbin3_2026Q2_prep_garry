2026/2/27
rewrote /pre-builder/typescript/keygen.ts . Removed 2 functions of Base58 code conversion. left one function for checking existed wallet or generating a new one.

2026/2/27
rewrote pre-builders/typescript/airdrop.ts. Reduced redundant RPC calls by using latestBlockhash.lastValidBlockHeight, lowered airdrop amount to 1 SOL, improved terminal output formatting, and added basic RPC fallback retry to handle devnet instability.
