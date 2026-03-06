import { Connection } from "@solana/web3.js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
//Get all the RPC nodes configured
export function getRpcEndPoints(): string[] {
  const endpoints: string[] = [];
  if (process.env.SOLANA_RPC_URL) endpoints.push(process.env.SOLANA_RPC_URL);
  if (process.env.SOLANA_RPC_FALLBACK_1)
    endpoints.push(process.env.SOLANA_RPC_FALLBACK_1);
  if (process.env.SOLANA_RPC_FALLBACK_2)
    endpoints.push(process.env.SOLANA_RPC_FALLBACK_2);

  //In case the env file is unconfigured
  if (endpoints.length === 0) endpoints.push("https://api.devnet.solana.com");

  return endpoints;
}

//Check if it is retriable
function isRetriableError(error: any): boolean {
  const errorMsg = error instanceof Error ? error.message : String(error);

  //Define Errors not worth retrying
  const fatalKeywords = [
    "Simulation failed",
    "custom program error",
    "insufficient funds",
    "Signature verification failed",
    "invalid account data",
    "invalid program argument",
    "insufficient balance",
    "429",
    "fetch failed",
    "timeout",
    "Internal error",
    "blockhash not found",
  ];

  for (const keyword of fatalKeywords) {
    if (errorMsg.includes(keyword)) {
      return false;
    }
  }

  return true; //take it as network issue
}

//Core injection. Automatically inject Connection and handle error retries.
export async function executeWithFallback<T>(
  operation: (connection: Connection) => Promise<T>,
  maxRetriesPerEndpoint = 2,
): Promise<T> {
  const endpoints = getRpcEndPoints();

  for (const endpoint of endpoints) {
    const connection = new Connection(endpoint, "confirmed");

    for (let attempt = 1; attempt <= maxRetriesPerEndpoint; attempt++) {
      try {
        //Return result if success
        return await operation(connection);
      } catch (error) {
        if (!isRetriableError(error)) {
          console.error(
            `[Fatal Error] Transaction encountered error and thus aborted`,
          );
          throw error;
        }

        const msg = error instanceof Error ? error.message : String(error);
        console.warn(
          `[RPC Warning] Node ${endpoint} Failed ${attempt} time:${msg.substring(0, 100)}... `,
          error instanceof Error ? error.message : error,
        );

        if (attempt === maxRetriesPerEndpoint) break;

        console.log("Retrying in 1 second...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw new Error(
    "[RPC Error] all RPC nodes are paralyzed, transaction aborted",
  );
}
