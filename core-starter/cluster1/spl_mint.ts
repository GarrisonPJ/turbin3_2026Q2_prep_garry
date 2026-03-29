import "dotenv/config";
import { logTxError } from "./utils/errors";
import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../turbin3-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  commitment,
);

const token_decimals = 1_000_000n;

// Mint address
if (!process.env.WBA_MINT_ADDRESS)
  throw new Error("[ERROR] WBA_MINT_ADDRESS not found in ../.env");

const mint = new PublicKey(process.env.WBA_MINT_ADDRESS);

(async () => {
  try {
    // Create an ATA
    // console.log(`Your ata is: ${ata.address.toBase58()}`);
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
    );
    console.log(`[INFO] Your ATA address is:${ata.address.toBase58()}`);
    // Mint to ATA
    // console.log(`Your mint txid: ${mintTx}`);
    const mintTx = await mintTo(
      connection,
      keypair,
      mint,
      ata.address,
      keypair.publicKey,
      100n * token_decimals,
    );
    console.log(`[INFO] Success! Mint Transaction ID: ${mintTx}`);
    console.log("[INFO] Check it out: ");
    console.log(`https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);
  } catch (error) {
    await logTxError("spl_mint failed", error);
  }
})();
