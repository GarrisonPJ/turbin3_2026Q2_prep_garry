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
import { buildIdlCompat } from "./utils/anchor_idl_compat";
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

const idlCompat = buildIdlCompat(IDL as any, programId);
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
