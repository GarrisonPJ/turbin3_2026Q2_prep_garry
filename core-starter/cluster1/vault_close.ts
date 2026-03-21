import "dotenv/config";
import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  BN,
} from "@coral-xyz/anchor";
import { IDL } from "./programs/wba_vault";
import wallet from "../turbin3-wallet.json";
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
  return {
    ...a,
    name,
    discriminator: accountDiscriminator(name),
  };
});

const normalizedTypes = normalizedAccounts.map((acc: any) => ({
  name: acc.name,
  type: acc.type,
}));

const normalizedInstructions = ((IDL as any).instructions ?? []).map(
  (ix: any) => {
    const i = normalizeLegacyIdlType(ix);
    return {
      ...i,
      accounts: (i.accounts ?? []).map(normalizeInstructionAccountMeta),
      discriminator: instructionDiscriminator(ix.name),
    };
  },
);

const idlCompat = {
  ...IDL,
  address: programId,
  accounts: normalizedAccounts,
  types: normalizedTypes,
  instructions: normalizedInstructions,
};

const program = new Program(idlCompat as any, provider);

// Create a random keypair
const vaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));

// Create a random keypair
// const closeVaultState = ???
const closeVaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));

(async () => {
  try {
    const [closeStateInfo, stateInfo] = await Promise.all([
      connection.getAccountInfo(closeVaultState, commitment),
      connection.getAccountInfo(vaultState, commitment),
    ]);

    if (!closeStateInfo) {
      throw new Error(
        `[ERROR] closeVaultState account not found: ${closeVaultState.toBase58()}`,
      );
    }
    if (!stateInfo) {
      throw new Error(`[ERROR] vaultState account not found: ${vaultState.toBase58()}
  `);
    }

    const ownerBefore = await connection.getBalance(
      keypair.publicKey,
      commitment,
    );
    // const signature = await program.methods
    // .closeAccount()
    // .accounts({
    //     ???
    // })
    // .signers([
    //     keypair
    // ]).rpc();
    // console.log(`Close success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
    const signature = await program.methods
      .closeAccount()
      .accounts({
        owner: keypair.publicKey,
        closeVaultState,
        vaultState,
        systemProgram: SystemProgram.programId,
      }) // owner signed automatically by provider
      .rpc();

    const ownerAfter = await connection.getBalance(
      keypair.publicKey,
      commitment,
    );

    console.log("[INFO] Close success");
    console.log("[INFO] owner:", keypair.publicKey.toBase58());
    console.log("[INFO] closeVaultState:", closeVaultState.toBase58());
    console.log("[INFO] vaultState:", vaultState.toBase58());
    console.log("[INFO] owner balance before:", ownerBefore);
    console.log("[INFO] owner balance after :", ownerAfter);
    console.log(`[INFO] TX:
  https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error("[ERROR] vault_close failed and aborted:", e);
  }
})();
