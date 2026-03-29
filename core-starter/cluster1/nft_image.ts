import "dotenv/config";
import { logTxError } from "./utils/errors";
import path from "path";
import wallet from "../turbin3-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

function guessContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  throw new Error(`[ERROR] Unsupported image extension: ${ext}`);
}

// Create a devnet connection
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const umi = createUmi(rpcUrl);
const imagePath = process.env.NFT_IMAGE_PATH ?? "./cluster1/coin.png";
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    const imageBuffer = await readFile(imagePath);
    const fileName = path.basename(imagePath);
    const contentType = guessContentType(fileName);
    const imageFile = createGenericFile(imageBuffer, fileName, { contentType });
    const [imageUri] = await umi.uploader.upload([imageFile]);

    console.log("[INFO] Image uploaded:");
    console.log(imageUri);
  } catch (error) {
    await logTxError("nft_image failed", error);
  }
})();
