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
import { createHash } from "crypto";
import { IDL } from "./programs/wba_vault";
import wallet from "../turbin3-wallet.json";
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

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const commitment: Commitment = "confirmed";
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, commitment);
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

const programId = requiredEnv("WBA_VAULT_PROGRAM_ID") as Address;
const vaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));
const tokenMint = new PublicKey(requiredEnv("WBA_MINT_ADDRESS"));

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

const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.toBuffer()],
  program.programId,
);

const tokenDecimals = 6;
const humanAmount = 1;
const amount = new BN(humanAmount * 10 ** tokenDecimals);

(async () => {
  try {
    const [ownerAta, vaultAta] = await Promise.all([
      getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        keypair.publicKey,
      ),
      getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        vaultAuth,
        true,
      ),
    ]);

    const signature = await program.methods
      .depositSpl(amount)
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

    console.log("[INFO] deposit_spl success");
    console.log("[INFO] owner:", keypair.publicKey.toBase58());
    console.log("[INFO] vaultState:", vaultState.toBase58());
    console.log("[INFO] vaultAuth:", vaultAuth.toBase58());
    console.log("[INFO] tokenMint:", tokenMint.toBase58());
    console.log("[INFO] ownerAta:", ownerAta.address.toBase58());
    console.log("[INFO] vaultAta:", vaultAta.address.toBase58());
    console.log("[INFO] amount(base units):", amount.toString());
    console.log(
      `[INFO] TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (e) {
    console.error("[ERROR] vault_deposit_spl failed and aborted:", e);
  }
})();
