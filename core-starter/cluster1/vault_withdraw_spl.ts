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
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

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
const tokenMint = new PublicKey(requiredEnv("WBA_MINT_ADDRESS"));
  // Create the PDA for our enrollment account
  // Seeds are "auth", vaultState
  // const vaultAuth = ???
const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.toBuffer()],
  program.programId,
);
  // Create the vault key
  // Seeds are "vault", vaultAuth
  // const vault = ???
const tokenDecimals = 6;
const humanAmount = 1;
const amount = new BN(humanAmount * 10 ** tokenDecimals);

// Execute our enrollment transaction
(async () => {
  try {
      // const signature = await program.methods
      // .withdraw(new BN(<number>))
      // .accounts({
      //    ???
      // })
      // .signers([
      //     keypair
      // ]).rpc();
      // console.log(`Withdraw success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
      
    const stateInfo = await connection.getAccountInfo(vaultState, commitment);
    if (!stateInfo) {
      throw new Error(
        `[ERROR] vaultState is not initialized/found: ${vaultState.toBase58()}. Re-run vault_init and update WBA_VAULT_STATE.`,
      );
    }

    // owner ATA
      const ownerAta = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        keypair.publicKey,
      );

      // vault ATA (PDA is the owner，needs allowOwnerOffCurve=true)
      const vaultAta = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        vaultAuth,
        true,
      );

      const signature = await program.methods
        .withdrawSpl(amount)
        .accounts({
          owner: keypair.publicKey,
          ownerAta: ownerAta.address,
          vaultState,
          vaultAuth,
          vaultAta: vaultAta.address,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

    const [ownerAfter, vaultAfter] = await Promise.all([
      connection.getTokenAccountBalance(ownerAta.address, commitment),
      connection.getTokenAccountBalance(vaultAta.address, commitment),
    ]);

    console.log("[INFO] Withdraw SPL success");
    console.log("[INFO] owner:", keypair.publicKey.toBase58());
    console.log("[INFO] vaultState:", vaultState.toBase58());
    console.log("[INFO] vaultAuth:", vaultAuth.toBase58());
    console.log("[INFO] tokenMint:", tokenMint.toBase58());
    console.log("[INFO] ownerAta:", ownerAta.address.toBase58());
    console.log("[INFO] vaultAta:", vaultAta.address.toBase58());
    console.log("[INFO] withdraw amount(base units):", amount.toString());
    console.log("[INFO] ownerAta after:", ownerAfter.value.amount);
    console.log("[INFO] vaultAta after:", vaultAfter.value.amount);
    console.log(
      `[INFO] https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (e) {
    console.error(`[ERROR] vault_withdraw_spl failed and aborted: ${e}`);
  }
})();
