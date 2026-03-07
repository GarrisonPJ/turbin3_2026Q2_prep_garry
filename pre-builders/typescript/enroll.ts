import { Keypair } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "../dev-wallet.json";
import { executeWithFallback } from "./utils/rpc";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

(async () => {
  try {
    if (!process.env.GITHUB_HANDLE)
      throw new Error("Missing GITHUB_HANDLE in .env");
    const github = Buffer.from(process.env.GITHUB_HANDLE, "utf8");

    await executeWithFallback(async (connection) => {
      const provider = new AnchorProvider(connection, new Wallet(keypair), {
        commitment: "confirmed",
      });
      const program = new Program<Turbin3Prereq>(IDL, provider);

      // Create the PDA for our enrollment account  No need for manual calculation. Anchor got this
      // const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
      // const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

      // Execute the enrollment transaction
      const txhash = await program.methods
        .complete(github)
        .accounts({
          signer: keypair.publicKey,
        })
        .rpc(); // Removed signer function, Anchor will handle it since we passed keypair to provider before.

      console.log("Success! Check out TX here:");
      console.log(`https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    //exclude the case that wallet is already enrolled
    if (
      errorMsg.includes("already in use") ||
      errorMsg.includes("custom program error: 0x0")
    ) {
      //Anchor sometimes reports 'already in use ' as 'custom error 0x0'
      console.log("You have already enrolled");
    } else {
      console.error("Enroll encounterd error and thus aborted:", e);
    }
  }
})();
