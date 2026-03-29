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
const idlCompat = buildIdlCompat(IDL as any, programId);
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
  } catch (error) {
    await logTxError("vault_deposit failed", error);
  }
})();
