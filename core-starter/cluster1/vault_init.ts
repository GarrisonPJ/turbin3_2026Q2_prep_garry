import "dotenv/config";
import { logTxError } from "./utils/errors";
import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import { Program, Wallet, AnchorProvider, Address } from "@coral-xyz/anchor";
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
const programId = "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address;
const idlCompat = buildIdlCompat(IDL as any, programId);
const program = new Program(idlCompat as any, provider);

// Create a random keypair
const vaultState = Keypair.generate();
console.log(`[INFO] vaultState: ${vaultState.publicKey.toBase58()}`);

// Create the PDA for our enrollment account
// Seeds are "auth", vaultState
const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.publicKey.toBuffer()],
  program.programId,
);

// Create the vault key
// Seeds are "vault", vaultAuth
const [vault] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), vaultAuth.toBuffer()],
  program.programId,
);

console.log(`[INFO] vaultAuth: ${vaultAuth.toBase58()}`);
console.log(`[INFO] vault: ${vault.toBase58()}`);

// Execute our enrollment transaction
(async () => {
  try {
    // const signature = await program.methods.initialize()
    // .accounts({
    // }).signers([keypair, vaultState]).rpc();
    // console.log(`Init success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
    const signature = await program.methods
      .initialize()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([vaultState])
      .rpc();

    console.log("[INFO] Init success! Check:");
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (error) {
    await logTxError("vault_init failed", error);
  }
})();
