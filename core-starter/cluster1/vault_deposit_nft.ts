import "dotenv/config";
import { logTxError } from "./utils/errors";
import { requiredEnv, requiredOneOfEnv } from "./utils/env";
import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
} from "@coral-xyz/anchor";
import { IDL } from "./programs/wba_vault";
import { buildIdlCompat } from "./utils/anchor_idl_compat";
import wallet from "../turbin3-wallet.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const commitment: Commitment = "confirmed";
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, commitment);
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

const programId = requiredEnv("WBA_VAULT_PROGRAM_ID") as Address;
const vaultState = new PublicKey(requiredEnv("WBA_VAULT_STATE"));
const nftMintEnv = requiredOneOfEnv(["NFT_MINT_ADDRESS", "WBA_NFT_MINT_ADDRESS"]);
const tokenMint = new PublicKey(nftMintEnv);

const idlCompat = buildIdlCompat(IDL as any, programId);
const program = new Program(idlCompat as any, provider);

const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.toBuffer()],
  program.programId,
);

const metadataProgram = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);
const nftMetadata = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), metadataProgram.toBuffer(), tokenMint.toBuffer()],
  metadataProgram,
)[0];
const nftMasterEdition = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    metadataProgram.toBuffer(),
    tokenMint.toBuffer(),
    Buffer.from("edition"),
  ],
  metadataProgram,
)[0];

(async () => {
  try {
    const stateInfo = await connection.getAccountInfo(vaultState, commitment);
    if (!stateInfo) {
      throw new Error(
        `[ERROR] vaultState is not initialized/found: ${vaultState.toBase58()}. Re-run vault_init and update WBA_VAULT_STATE.`,
      );
    }

    const [ownerAta, vaultAta] = await Promise.all([
      getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        keypair.publicKey,
      ),
      getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenMint,
        vaultAuth,
        true,
      ),
    ]);

    const signature = await program.methods
      .depositNft()
      .accounts({
        owner: keypair.publicKey,
        ownerAta: ownerAta.address,
        vaultState,
        vaultAuth,
        vaultAta: vaultAta.address,
        tokenMint,
        nftMetadata,
        nftMasterEdition,
        metadataProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("[INFO] Deposit NFT success");
    console.log("[INFO] owner:", keypair.publicKey.toBase58());
    console.log("[INFO] vaultState:", vaultState.toBase58());
    console.log("[INFO] vaultAuth:", vaultAuth.toBase58());
    console.log("[INFO] tokenMint:", tokenMint.toBase58());
    console.log("[INFO] ownerAta:", ownerAta.address.toBase58());
    console.log("[INFO] vaultAta:", vaultAta.address.toBase58());
    console.log("[INFO] nftMetadata:", nftMetadata.toBase58());
    console.log("[INFO] nftMasterEdition:", nftMasterEdition.toBase58());
    console.log(
      `[INFO] TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (error) {
    await logTxError("vault_deposit_nft failed", error);
  }
})();
