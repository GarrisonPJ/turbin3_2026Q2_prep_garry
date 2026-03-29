export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[ERROR] Missing env: ${name}`);
  return value;
}

export function requiredOneOfEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`[ERROR] Missing env: one of [${names.join(", ")}]`);
}
