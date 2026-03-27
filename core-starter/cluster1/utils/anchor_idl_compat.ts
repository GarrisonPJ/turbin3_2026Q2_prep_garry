import { createHash } from "crypto";

function normalizeLegacyIdlType(value: any): any {
  if (value === "publicKey") return "pubkey";
  if (Array.isArray(value)) return value.map(normalizeLegacyIdlType);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeLegacyIdlType(v)]),
    );
  }
  return value;
}

function accountDiscriminator(name: string): number[] {
  return Array.from(
    createHash("sha256").update(`account:${name}`).digest().subarray(0, 8),
  );
}

function instructionDiscriminator(name: string): number[] {
  return Array.from(
    createHash("sha256")
      .update(`global:${name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}`)
      .digest()
      .subarray(0, 8),
  );
}

function normalizeInstructionAccountMeta(account: any) {
  const normalized = normalizeLegacyIdlType(account);
  return {
    ...normalized,
    signer:
      typeof normalized.signer === "boolean"
        ? normalized.signer
        : !!normalized.isSigner,
    writable:
      typeof normalized.writable === "boolean"
        ? normalized.writable
        : !!normalized.isMut,
  };
}

export function buildIdlCompat(idl: any, programId: any) {
  const normalizedAccounts = ((idl as any).accounts ?? []).map((acc: any) => {
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

  const normalizedInstructions = ((idl as any).instructions ?? []).map((ix: any) => {
    const normalized = normalizeLegacyIdlType(ix);
    return {
      ...normalized,
      accounts: (normalized.accounts ?? []).map(normalizeInstructionAccountMeta),
      discriminator: instructionDiscriminator(ix.name),
    };
  });

  return {
    ...idl,
    address: programId,
    types: normalizedTypes,
    accounts: normalizedAccounts,
    instructions: normalizedInstructions,
  };
}
