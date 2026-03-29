import "dotenv/config";
import { logTxError } from "./utils/errors";
import { requiredEnv } from "./utils/env";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../turbin3-wallet.json"
import base58 from "bs58";

const RPC_ENDPOINT = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {
    try {
        const metadataUri = requiredEnv("NFT_METADATA_URI");
        const nftName = process.env.NFT_NAME ?? "Garry NFT";
        const nftSymbol = process.env.NFT_SYMBOL ?? "GNFT";

        const tx = createNft(umi, {
            mint,
            name: nftName,
            symbol: nftSymbol,
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(0),
        });
        const result = await tx.sendAndConfirm(umi);
        const signature = base58.encode(result.signature);
        
        console.log("[INFO] Mint Address:", mint.publicKey);
        console.log(
            `[INFO] Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
        );
    } catch (error) {
    await logTxError("nft_mint failed", error);
  }
})();
