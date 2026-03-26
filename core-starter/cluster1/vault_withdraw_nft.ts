import "dotenv/config";
import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import { Program, Wallet, AnchorProvider, Address } from "@coral-xyz/anchor";
import { IDL } from "./programs/wba_vault";
import wallet from "../turbin3-wallet.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { createHash } from "crypto";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[ERROR] Missing env: ${name}`);
  return v;
}

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Commitment
const commitment: Commitment = "confirmed";

// Create a devnet connection
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, commitment);

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const programId = requiredEnv("WBA_VAULT_PROGRAM_ID") as Address;
const vaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));
const nftMintEnv = process.env.NFT_MINT_ADDRESS ?? process.env.WBA_NFT_MINT_ADDRESS;
if (!nftMintEnv) {
  throw new Error("[ERROR] Missing env: NFT_MINT_ADDRESS (or WBA_NFT_MINT_ADDRESS)");
}
const tokenMint = new PublicKey(nftMintEnv);

const normalizeLegacyIdlType = (value: any): any => {
  if (value === "publicKey") return "pubkey";
  if (Array.isArray(value)) return value.map(normalizeLegacyIdlType);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeLegacyIdlType(v)]),
    );
  }
  return value;
};

const accountDiscriminator = (name: string): number[] =>
  Array.from(
    createHash("sha256").update(`account:${name}`).digest().subarray(0, 8),
  );

const instructionDiscriminator = (name: string): number[] =>
  Array.from(
    createHash("sha256")
      .update(
        `global:${name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}`,
      )
      .digest()
      .subarray(0, 8),
  );

const normalizeInstructionAccountMeta = (account: any) => {
  const a = normalizeLegacyIdlType(account);
  return {
    ...a,
    signer: typeof a.signer === "boolean" ? a.signer : !!a.isSigner,
    writable: typeof a.writable === "boolean" ? a.writable : !!a.isMut,
  };
};

const normalizedAccounts = ((IDL as any).accounts ?? []).map((acc: any) => {
  const a = normalizeLegacyIdlType(acc);
  const name = typeof a.name === "string" ? a.name.toLowerCase() : a.name;
  return { ...a, name, discriminator: accountDiscriminator(name) };
});

const normalizedTypes = normalizedAccounts.map((acc: any) => ({
  name: acc.name,
  type: acc.type,
}));

const normalizedInstructions = ((IDL as any).instructions ?? []).map((ix: any) => {
  const i = normalizeLegacyIdlType(ix);
  return {
    ...i,
    accounts: (i.accounts ?? []).map(normalizeInstructionAccountMeta),
    discriminator: instructionDiscriminator(ix.name),
  };
});

const idlCompat = {
  ...IDL,
  address: programId,
  accounts: normalizedAccounts,
  types: normalizedTypes,
  instructions: normalizedInstructions,
};

const program = new Program(idlCompat as any, provider);

// Create the PDA for our enrollment account
// Seeds are "auth", vaultState
const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.toBuffer()],
  program.programId,
);

// Mint address
const metadataProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const nftMetadata = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), metadataProgram.toBuffer(), tokenMint.toBuffer()],
  metadataProgram,
)[0];
const nftMasterEdition = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    metadataProgram.toBuffer(),
    tokenMint.toBuffer(),
    Buffer.from("edition"),
  ],
  metadataProgram,
)[0];

// Execute our enrollment transaction
(async () => {
  try {
    const stateInfo = await connection.getAccountInfo(vaultState, commitment);
    if (!stateInfo) {
      throw new Error(
        `[ERROR] vaultState is not initialized/found: ${vaultState.toBase58()}.`,
      );
    }

    // Get the token account of the fromWallet address, and if it does not exist, create it
    const [ownerAta, vaultAta] = await Promise.all([
      getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        keypair.publicKey,
      ),
      getOrCreateAssociatedTokenAccount(connection, keypair, tokenMint, vaultAuth, true),
    ]);

    const signature = await program.methods
      .withdrawNft()
      .accounts({
        owner: keypair.publicKey,
        ownerAta: ownerAta.address,
        vaultState,
        vaultAuth,
        vaultAta: vaultAta.address,
        tokenMint,
        nftMetadata,
        nftMasterEdition,
        metadataProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("[INFO] Withdraw NFT success");
    console.log(
      `[INFO] TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (e) {
    console.error("[ERROR] vault_withdraw_nft failed and aborted:", e);
  }
})();
