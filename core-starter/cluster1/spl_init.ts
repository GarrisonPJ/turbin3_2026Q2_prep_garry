import "dotenv/config";
import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../turbin3-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  commitment,
);

(async () => {
  try {
    // Start here
    // const mint = ???
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6,
    );

    console.log(
      `[INFO] Success! Your new token mint address is ${mint.toBase58()}`,
    );
  } catch (error) {
    console.log(`[ERROR] Mint went wrong and aborted: ${error}`);
  }
})();
