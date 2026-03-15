import "dotenv/config";
import bs58 from "bs58";
import wallet from "../turbin3-wallet.json";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  percentAmount,
  none,
  some,
} from "@metaplex-foundation/umi";
import {
  createV1,
  TokenStandard,
  mplTokenMetadata,
  findMetadataPda,
  type CreatorArgs,
} from "@metaplex-foundation/mpl-token-metadata";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[ERROR] ${name} is missing in .env`);
  return value;
}

async function assertMintAuthorityMatches(params: {
  connection: Connection;
  mint: PublicKey;
  expectedAuthority: PublicKey;
}) {
  const mintAccount = await getMint(params.connection, params.mint);
  const onChainAuthority = mintAccount.mintAuthority;
  if (!onChainAuthority) {
    throw new Error("[ERROR] Mint has no mint authority (immutable mint)");
  }
  if (!onChainAuthority.equals(params.expectedAuthority)) {
    throw new Error(
      `[ERROR] Mint authority mismatch. on-chain=${onChainAuthority.toBase58()}
  expected=${params.expectedAuthority.toBase58()}`,
    );
  }
}

async function main() {
  // Load configures
  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const mintAddress = requiredEnv("WBA_MINT_ADDRESS");

  const tokenName = "GARRY TOKEN";
  const tokenSymbol = "GARRY";
  const tokenUri =
    "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json"; //hardcoded temporarily

  // Init Umi / signer
  const umi = createUmi(rpcUrl).use(mplTokenMetadata());
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  const mint = publicKey(mintAddress);

  // Authority pre checking
  const connection = new Connection(rpcUrl, "confirmed");
  await assertMintAuthorityMatches({
    connection,
    mint: new PublicKey(mintAddress),
    expectedAuthority: new PublicKey(signer.publicKey),
  });

  // Organize metadata data
  const creators: CreatorArgs[] = [
    {
      address: signer.publicKey,
      verified: true,
      share: 100,
    },
  ];

  if (creators.length > 1) {
    let totalShare = 0;
    for (let i = 0; i < creators.length; i++) {
      totalShare += creators[i].share;
    }
    if (totalShare !== 100)
      throw new Error("[ERROR] totalShare does not qeual 100");
  }

  // Create metadata
  const metadataPda = findMetadataPda(umi, { mint });
  const txBuilder = createV1(umi, {
    mint,
    authority: signer, // mint authority signer
    payer: signer,
    updateAuthority: signer,
    metadata: metadataPda,

    name: tokenName,
    symbol: tokenSymbol,
    uri: tokenUri,
    sellerFeeBasisPoints: percentAmount(0),
    creators: some(creators),
    tokenStandard: TokenStandard.Fungible,
    isMutable: true,
    primarySaleHappened: false,

    // Fungible usually empty
    collection: none(),
    uses: none(),
    collectionDetails: none(),
    ruleSet: none(),
    decimals: none(),
    printSupply: none(),
  });

  // Send transaction
  const result = await txBuilder.sendAndConfirm(umi);
  const signature = bs58.encode(result.signature);

  console.log("[INFO] mint:", mint.toString());
  console.log("[INFO] metadata PDA:", metadataPda.toString());
  console.log("[INFO] Success!,check:");
  console.log(`tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
