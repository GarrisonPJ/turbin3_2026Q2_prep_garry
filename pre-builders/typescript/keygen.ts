import { Keypair } from "@solana/web3.js";
import { existsSync, readFileSync, writeFileSync } from "fs";

function loadOrGenWallet() {
  const WALLET = "../dev-wallet.json";

  if (existsSync(WALLET)) {
    const walletData = readFileSync(WALLET, "utf-8");
    const keypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(walletData)),
    );

    console.log(`[INFO] You already have a wallet here: ${WALLET}`);
    console.log(`[INFO] Public Key is: ${keypair.publicKey.toBase58()}`);
  } else {
    console.log("[INFO] Your Keypair is generating...");

    //generate keypair
    let keyPair = Keypair.generate();

    //log the keypair & the secret key
    console.log(
      `[INFO] Your new wallet Public Key is : ${keyPair.publicKey.toBase58()}`,
    );

    // save the wallet
    writeFileSync(WALLET, JSON.stringify(Array.from(keyPair.secretKey)));
    console.log(`[INFO] Your wallet is saved to: ${WALLET}`);
  }
}

loadOrGenWallet();
