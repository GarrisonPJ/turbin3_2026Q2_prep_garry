#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

RUNNER="./scripts/run_with_proxy_fallback.sh"

if [[ ! -x "$RUNNER" ]]; then
  echo "[ERROR] Missing executable runner: $RUNNER"
  exit 1
fi

steps=(
  spl_init
  spl_mint
  spl_transfer
  spl_metadata
  nft_image
  nft_metadata
  nft_mint
  vault_init
  vault_deposit
  vault_withdraw
  vault_deposit_spl
  vault_withdraw_spl
  vault_deposit_nft
  vault_withdraw_nft
  vault_close
)

echo "[INFO] Starting Cluster1 regression (${#steps[@]} steps)"
for step in "${steps[@]}"; do
  echo "\n[INFO] ===== Step: $step ====="
  bash "$RUNNER" "$step"
done

echo "\n[INFO] Cluster1 regression completed successfully"
