import {
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionConfirmationStrategy,
} from "@solana/web3.js";
import wallet from "../dev-wallet.json";
import { executeWithFallback } from "./utils/rpc";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

(async () => {
  try {
    await executeWithFallback(async (connection) => {
      console.log(`Airdrop address: ${keypair.publicKey.toBase58()}`);

      // claim 1 devnet SOL tokens to decrease the possibility of rate-limitting
      const txhash = await connection.requestAirdrop(
        keypair.publicKey,
        LAMPORTS_PER_SOL,
      );

      // get the latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");

      // wait for the transaction to be confirmed
      const strategy: TransactionConfirmationStrategy = {
        signature: txhash,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight, // use the data already returned instead of requesting again
      };

      await connection.confirmTransaction(strategy, "confirmed"); // passing strategy here instead, old method deprecated

      console.log("Success! Check out your TX here:");
      console.log(`https://explorer.solana.com/tx/${txhash}?cluster=devnet`); // keep the url complete from the possible line wrapping
    });
  } catch (e) {
    console.error("Airdrop encountered errors and thus aborted");
  }
})();
