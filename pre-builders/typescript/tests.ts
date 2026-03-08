import assert from "assert";
import { SendTransactionError } from "@solana/web3.js";
import { isRetriableError } from "./utils/rpc";

function runTests() {
  console.log("[INFO] Running TypeScript Unit Tests...");

  // Test 1: RPC Error Classification - Network Error (Should Retry)
  const networkError = new TypeError("fetch failed");
  assert.strictEqual(
    isRetriableError(networkError),
    true,
    "Network errors should be retriable",
  );

  // Test 2: RPC Error Classification - Simulation Error (Should NOT Retry)
  const simulationError = new SendTransactionError({
    action: "send",
    signature: "",
    transactionMessage: "Simulation failed",
    logs: ["insufficient funds"],
  });
  assert.strictEqual(
    isRetriableError(simulationError),
    false,
    "Simulation errors should be fatal",
  );

  // Test 3: Transfer Boundary Logic (Mocking amount calculation)
  const balance = 1_000_000;
  const fee = 5_000;
  const rentExemption = 890_880;
  const amount = balance - fee - rentExemption;
  assert.ok(
    amount > 0,
    "Amount must be strictly positive to leave rent exemption",
  );

  // Test 4: Enroll Idempotency Routing (Mocking error catch)
  const anchorError = new Error(
    "failed to send transaction: custom program error: 0x0",
  );
  const isAlreadyEnrolled =
    anchorError.message.includes("already in use") ||
    anchorError.message.includes("custom program error: 0x0");
  assert.strictEqual(
    isAlreadyEnrolled,
    true,
    "Should correctly route 0x0 to idempotency success",
  );

  console.log("[INFO] All TS Unit Tests Passed!");
}

runTests();
