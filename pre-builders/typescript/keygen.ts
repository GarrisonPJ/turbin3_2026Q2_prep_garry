import { Keypair } from '@solana/web3.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';

function loadOrGenWallet() {
  const WALLET = 'dev-wallet.json';

  if (existsSync(WALLET)) {
    const wallet = readFileSync(WALLET, 'utf-8');

    console.log('you have a wallet already:');
    console.log('wallet', wallet);
  }
  else {
    console.log('your Keypair is generating');

    //generate keypair
    let keyPair = Keypair.generate();

    //log the keypair & the secret key
    console.log(`your new wallet is : ${keyPair.publicKey.toBase58()}`);
    console.log(`[${keyPair.secretKey}]`);

    // save the wallet
    writeFileSync(WALLET, JSON.stringify(Array.from(keyPair.secretKey)));
    console.log('your wallet is save to', WALLET);

  }
}

loadOrGenWallet();
