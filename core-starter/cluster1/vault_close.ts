import "dotenv/config";
import { logTxError } from "./utils/errors";
import { requiredEnv } from "./utils/env";
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
const idlCompat = buildIdlCompat(IDL as any, programId);
const program = new Program(idlCompat as any, provider);

// Create a random keypair
const vaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));

// Create a random keypair
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
  } catch (error) {
    await logTxError("vault_close failed", error);
  }
})();
