import "dotenv/config";
import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import wallet from "../turbin3-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  commitment,
);

// Mint address
if (!process.env.WBA_MINT_ADDRESS)
  throw new Error("[ERROR] WBA_MINT_ADDRESS is not in .env file");
const mint = new PublicKey(process.env.WBA_MINT_ADDRESS);

// Recipient address
const to = new PublicKey("HaZRyLZzRknszTHqHn4Kj1iu9uGr6Wiss3jPRDiVPQqz"); //Just used another wallet  of mine as a constant for convinence

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromATA = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
    );
    // Get the token account of the toWallet address, and if it does not exist, create it
    const toATA = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to,
    );

    // Transfer the new token to the "toTokenAccount" we just created
    const signature = await transfer(
      connection,
      keypair,
      fromATA.address,
      toATA.address,
      keypair,
      100_000n,
    );

    console.log("[INFO] Success! Check your transaction:");
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`[ERROR] Transfer went wrong and aborted: ${e}`);
  }
})();
