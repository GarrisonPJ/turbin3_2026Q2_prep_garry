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

//Rpc Endpoint
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// ProgramID
const programId = requiredEnv("WBA_VAULT_PROGRAM_ID") as Address;

// Commitment
const commitment: Commitment = "confirmed";

// Create a devnet connection
const connection = new Connection(rpcUrl, commitment);

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Map publicKey to pubkey
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

// Calculate discriminator
const accountDiscriminator = (name: string): number[] =>
  Array.from(
    createHash("sha256").update(`account:${name}`).digest().subarray(0, 8),
  );

const instructionDiscriminator = (name: string): number[] =>
  Array.from(
    createHash("sha256").update(`global:${name}`).digest().subarray(0, 8),
  );

// Make insctructions accounts fields compatible
const normalizeInstructionAccountMeta = (account: any) => {
  const a = normalizeLegacyIdlType(account);
  return {
    ...a,
    signer: typeof a.signer === "boolean" ? a.signer : !!a.isSigner,
    writable: typeof a.writable === "boolean" ? a.writable : !!a.isMut,
  };
};

// construct IDL
const normalizedAccounts = ((IDL as any).accounts ?? []).map((acc: any) => {
  const a = normalizeLegacyIdlType(acc);
  const name = typeof a.name === "string" ? a.name.toLowerCase() : a.name; // Vault -> vault
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

// Create our program
const program = new Program(idlCompat as any, provider);

// Init vault we created by vault_init.ts
const vaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));

// Create the PDA for our enrollment account
const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.toBuffer()],
  program.programId,
);

// Create the vault key
const [vault] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), vaultAuth.toBuffer()],
  program.programId,
);

const depositLamports = new BN(10_000_000);

// Execute our enrollment transaction
(async () => {
  try {
    // const signature = await program.methods
    // .deposit(new BN(<number>)    )
    // .accounts({
    //    ???
    // })
    // .signers([
    //     keypair
    // ]).rpc();
    const ownerBefore = await connection.getBalance(
      keypair.publicKey,
      commitment,
    );
    const vaultBefore = await connection.getBalance(vault, commitment);

    const signature = await program.methods
      .deposit(depositLamports)
      .accounts({
        owner: keypair.publicKey,
        vaultState,
        vaultAuth,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .rpc(); // No need for signers() as provider signs owner automatically

    // console.log(`Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
    const ownerAfter = await connection.getBalance(
      keypair.publicKey,
      commitment,
    );
    const vaultAfter = await connection.getBalance(vault, commitment);

    console.log("[INFO] Deposit success");
    console.log("[INFO] owner:", keypair.publicKey.toBase58());
    console.log("[INFO] vaultState:", vaultState.toBase58());
    console.log("[INFO] vaultAuth:", vaultAuth.toBase58());
    console.log("[INFO] vault:", vault.toBase58());
    console.log("[INFO] deposit(lamports):", depositLamports.toString());
    console.log("[INFO] owner balance before:", ownerBefore);
    console.log("[INFO] owner balance after :", ownerAfter);
    console.log("[INFO] vault balance before:", vaultBefore);
    console.log("[INFO] vault balance after :", vaultAfter);
    console.log(
      `[INFO] TX:https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (e) {
    console.error(`[ERROR] vault_deposit failed and aborted:${e}`);
  }
})();
