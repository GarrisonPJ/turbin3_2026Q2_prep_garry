import "dotenv/config";
import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import { createHash } from "crypto";
import { Program, Wallet, AnchorProvider, Address } from "@coral-xyz/anchor";
import { IDL } from "./programs/wba_vault";
import wallet from "../turbin3-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Commitment
const commitment: Commitment = "confirmed";

// Create a devnet connection
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, commitment);

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const programId = "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address;
const normalizeLegacyIdlType = (value: any): any => {
  if (value === "publicKey") return "pubkey";
  if (Array.isArray(value)) return value.map(normalizeLegacyIdlType);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeLegacyIdlType(v)]),
    );
  }
  return value;
};

const accountDiscriminator = (name: string): number[] => {
  const hash = createHash("sha256")
    .update(`account:${name}`)
    .digest();
  return Array.from(hash.subarray(0, 8));
};
const instructionDiscriminator = (name: string): number[] => {
  const hash = createHash("sha256")
    .update(`global:${name}`)
    .digest();
  return Array.from(hash.subarray(0, 8));
};

const normalizedInstructions = ((IDL as any).instructions ?? []).map(
  (ix: any) => ({
    ...normalizeLegacyIdlType(ix),
    discriminator: instructionDiscriminator(ix.name),
  }),
);

const normalizedAccounts = ((IDL as any).accounts ?? []).map((acc: any) => {
  const normalized = normalizeLegacyIdlType(acc);
  const name =
    typeof normalized.name === "string"
      ? normalized.name.toLowerCase()
      : normalized.name;
  return {
    ...normalized,
    name,
    discriminator: accountDiscriminator(name),
  };
});
const normalizedTypes = normalizedAccounts.map((acc: any) => ({
  name: acc.name,
  type: acc.type,
}));
const idlWithAddress = {
  ...IDL,
  address: programId,
  types: normalizedTypes,
  accounts: normalizedAccounts,
  instructions: normalizedInstructions,
} as typeof IDL & {
  address: Address;
};
const program = new Program(idlWithAddress as any, provider);

// Create a random keypair
const vaultState = Keypair.generate();
console.log(`[INFO] vaultState: ${vaultState.publicKey.toBase58()}`);

// Create the PDA for our enrollment account
// Seeds are "auth", vaultState
// const vaultAuth = ???
const [vaultAuth] = PublicKey.findProgramAddressSync(
  [Buffer.from("auth"), vaultState.publicKey.toBuffer()],
  program.programId,
);

// Create the vault key
// Seeds are "vault", vaultAuth
// const vault = ???
const [vault] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), vaultAuth.toBuffer()],
  program.programId,
);

console.log(`[INFO] vaultAuth: ${vaultAuth.toBase58()}`);
console.log(`[INFO] vault: ${vault.toBase58()}`);

// Execute our enrollment transaction
(async () => {
  try {
    // const signature = await program.methods.initialize()
    // .accounts({
    //     ???
    // }).signers([keypair, vaultState]).rpc();
    // console.log(`Init success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
    const signature = await program.methods
      .initialize()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([vaultState])
      .rpc();

    console.log("[INFO] Init success! Check:");
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error(`[ERROR] vault_init failed and aborted: ${e}`);
  }
})();
