import { Connection, Keypair } from "@solana/web3.js"
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor"
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./dev-wallet.json";
import "dotenv/config";
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const RPC_URLS = [
  process.env.SOLANA_RPC_URL,
  process.env.SOLANA_RPC_FALLBACK_1,
  process.env.SOLANA_RPC_FALLBACK_2,
  process.env.SOLANA_RPC_FALLBACK_3,
].filter((v): v is string => !!v);

const github = Buffer.from("GarrisonPJ", "utf8");

(async () => {
  if (RPC_URLS.length === 0) {
    console.error("No RPC URLs found. Please configure .env");
    return;
  }

  for (let i = 0; i < RPC_URLS.length; i++) {
    const rpcUrl = RPC_URLS[i];
    const connection = new Connection(rpcUrl, "confirmed");
    const provider = new AnchorProvider(
      connection,
      new Wallet(keypair),
      { commitment: "confirmed" });

    const program = new Program<Turbin3Prereq>(
      IDL,
      provider
    );

    // Create the PDA for our enrollment account  No need for manual calculation. Anchor got this
    // const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
    // const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

    // Execute the enrollment transaction

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Using RPC: ${rpcUrl} (attempt ${attempt}/3)`);
        const txhash = await program.methods
          .complete(github)
          .accounts({
            signer: keypair.publicKey,
          }).rpc(); // Removed signer function, Anchor will handle it since we passed keypair to provider before.

        console.log(`Success! Check out TX here:
          https://explorer.solana.com/tx/${txhash}?cluster=devnet`);

        console.log(`Success! Check out TX here:
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
        return;
      } catch (e) {
        console.error(`Oops, something went wrong: ${e}`)
      }
    }
  }
})();
