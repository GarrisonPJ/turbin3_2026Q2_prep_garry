import { SendTransactionError } from "@solana/web3.js";

export async function logTxError(context: string, error: unknown): Promise<void> {
  if (error instanceof SendTransactionError) {
    console.error(`[ERROR] ${context}: ${error.message}`);
    const txLogs = (error as any).transactionLogs as string[] | undefined;
    if (txLogs?.length) {
      console.error("[ERROR] On-chain logs:");
      for (const line of txLogs) {
        console.error(line);
      }
    }
    return;
  }

  console.error(`[ERROR] ${context}:`, error);
}
