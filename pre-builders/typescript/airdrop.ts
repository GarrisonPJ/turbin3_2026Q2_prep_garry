import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionConfirmationStrategy,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";
import "dotenv/config";

// create a connection to the devnet cluster
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// try multiple RPCs. if RPC returns "Internal error", switch to the next.
const RPC_URLS = [
  process.env.SOLANA_RPC_URL,
  process.env.SOLANA_RPC_FALLBACK_1,
  process.env.SOLANA_RPC_FALLBACK_2,
  process.env.SOLANA_RPC_FALLBACK_3,
].filter((v): v is string => !!v);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  if (RPC_URLS.length === 0) {
    console.error("No RPC URLs found. Please configure .env");
    return;
  }

  for (let i = 0; i < RPC_URLS.length; i++) {
    const rpcUrl = RPC_URLS[i];
    const connection = new Connection(rpcUrl, "confirmed");

    try {
      console.log(`Using RPC: ${rpcUrl}`);
      console.log(`Airdrop address: ${keypair.publicKey.toBase58()}`);

      // claim 1 devnet SOL tokens to decrease the possibility of rate-limitting
      const txhash = await connection.requestAirdrop(
        keypair.publicKey,
        LAMPORTS_PER_SOL
      );

      // get the latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash();

      // wait for the transaction to be confirmed
      const strategy: TransactionConfirmationStrategy = {
        signature: txhash,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight, // use the data already returned instead of requesting again
      };

      await connection.confirmTransaction(strategy, "confirmed"); // passing strategy here instead, old method deprecated

      console.log("Success! Check out your TX here:");
      console.log(`https://explorer.solana.com/tx/${txhash}?cluster=devnet`); // keep the url complete from the possible line wrapping
      return;
    } catch (e) {
      const msg = (e as any)?.message ?? String(e);

      console.error(e);

      // only switch RPCs for the "Internal error" case; otherwise stop early.
      if (
        msg.includes("Internal error") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("fetch failed") ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("blockhash not found")
      ) {
        console.error(`Oops, something went wrong: ${msg}`);
        console.error("RPC returned Internal error, switching RPC and retrying...\n");

        // small delay before switching to next RPC
        await sleep(800);
        continue;
      }

      console.error(`Oops, something went wrong: ${msg}`);
      return;
    }
  }

  console.error("All RPCs failed with Internal error. Please try again later.");
})();
