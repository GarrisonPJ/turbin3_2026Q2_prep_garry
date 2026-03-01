import {
  SystemProgram,
  Connection,
  Keypair,
  ComputeBudgetProgram,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import "dotenv/config";
import wallet from "./dev-wallet.json";

// Import our dev wallet keypair from the wallet file
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

const to = new PublicKey("HaZRyLZzRknszTHqHn4Kj1iu9uGr6Wiss3jPRDiVPQqz"); // another wallet of mine

// Create a connection to the devnet cluster (env primary + env fallbacks)
const RPC_URLS = [
  process.env.SOLANA_RPC_URL,
  process.env.SOLANA_RPC_FALLBACK_1,
  process.env.SOLANA_RPC_FALLBACK_2,
  process.env.SOLANA_RPC_FALLBACK_3,
].filter((v): v is string => !!v);

(async () => {
  for (let i = 0; i < RPC_URLS.length; i++) {
    const rpcUrl = RPC_URLS[i];
    const connection = new Connection(rpcUrl, "confirmed");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Using RPC: ${rpcUrl} (attempt ${attempt}/3)`);
        // Get balance of dev wallet
        const balance = await connection.getBalance(from.publicKey);
        if (balance === 0) throw new Error("Balance is 0. Please get SOL from faucet.solana.com first!");

        // Rewrote in Agave 3.0 Practice: Add Priority Fees (Compute Budget) to ensure the transaction lands
        const instructions = [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
          SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to,
            lamports: balance, // Dummy amount to calculate the exact message size
          })
        ];

        const blockstat = await connection.getLatestBlockhash('confirmed');

        // Compile instructions into a V0 Message to accurately estimate the network fee
        const messageV0 = new TransactionMessage({
          payerKey: from.publicKey,
          recentBlockhash: blockstat.blockhash,
          instructions: instructions,
        }).compileToV0Message();

        // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
        const fee = (await connection.getFeeForMessage(messageV0, 'confirmed')).value || 0;

        // Immutable approach: Overwrite the dummy instruction with the exact lamports (balance - fee)
        const amount = balance - fee;
        if (amount <= 0) {
          throw new Error(`Insufficient balance after fee. balance=${balance}, fee=${fee}`);
        }
        instructions[2] = SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: to,
          lamports: amount,
        });

        const finalMessageV0 = new TransactionMessage({
          payerKey: from.publicKey,
          recentBlockhash: blockstat.blockhash,
          instructions: instructions,
        }).compileToV0Message();

        // Create VersionedTransaction (V0), sign, send and watch for confirmation
        const transaction = new VersionedTransaction(finalMessageV0);
        transaction.sign([from]);

        const txid = await connection.sendTransaction(transaction, { skipPreflight: false, maxRetries: 3 });

        await connection.confirmTransaction({
          blockhash: blockstat.blockhash,
          lastValidBlockHeight: blockstat.lastValidBlockHeight,
          signature: txid,
        }, 'confirmed');

        console.log('Success! Check out your TX here:');
        console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);
      } catch (e) {
        console.error(`Oops, something went wrong: ${e}`);
      }
    }
  }
})();
