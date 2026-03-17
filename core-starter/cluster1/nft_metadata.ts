import "dotenv/config";
import wallet from "../turbin3-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFileFromJson,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[ERROR] Missing env: ${name}`);
  return value;
}

// Create a devnet connection
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const imageUri = process.env.NFT_IMAGE_URI ?? "TODO_IMAGE_URI"; //Hardcode ruslt of nft_image url for now
const nftName = process.env.NFT_NAME ?? "TODO_NAME";
const nftSymbol = process.env.NFT_SYMBOL ?? "TODO_SYMBOL";
const nftDescription =
  process.env.NFT_DESCRIPTION ?? "TODO_DESCRIPTION_FOR_YOUR_NFT";

const umi = createUmi(rpcUrl);
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz",
    providerUrl: rpcUrl,
    timeout: 60_000,
  }),
);
umi.use(signerIdentity(signer));

(async () => {
  try {
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure
    if (imageUri.includes("TODO_IMAGE_URI")) {
      throw new Error(
        "[ERROR] Check NFT_IMAGE_URI in .env file or replace TODO_IMAGE_URI above.",
      );
    }
    //Construct metadata JSON
    const metadata = {
      name: nftName,
      symbol: nftSymbol,
      description: nftDescription,
      image: imageUri,
      attributes: [],
      properties: {
        files: [
          {
            type: "image/png",
            uri: imageUri,
          },
        ],
      },
      creators: [
        {
          address: signer.publicKey,
          share: 100,
        },
      ],
    };
    //Upload metada JSOn
    const metadataFile = createGenericFileFromJson(metadata, "metadata.json");
    //Upload &get URI
    const [metadataUri] = await umi.uploader.upload([metadataFile]);

    console.log("[INFO] Meatadata uploaded successfully. Check:");
    console.log(metadataUri);
  } catch (error) {
    console.log("[ERROR] nft_metadata failed and aborted:", error);
  }
})();
