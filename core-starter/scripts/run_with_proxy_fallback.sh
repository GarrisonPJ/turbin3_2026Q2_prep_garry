#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <npm-script-name>"
  exit 2
fi

SCRIPT_NAME="$1"

run_and_check() {
  local mode="$1"
  local output
  local status

  if [[ "$mode" == "proxy_off" ]]; then
    output="$(
      env -u http_proxy -u https_proxy -u all_proxy -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
        NO_PROXY=devnet.irys.xyz,gateway.irys.xyz \
        no_proxy=devnet.irys.xyz,gateway.irys.xyz \
        npm run "$SCRIPT_NAME" 2>&1
    )"
    status=$?
  else
    output="$(npm run "$SCRIPT_NAME" 2>&1)"
    status=$?
  fi

  printf '%s\n' "$output"

  if [[ $status -ne 0 ]]; then
    return 1
  fi
  if printf '%s' "$output" | rg -q "\\[ERROR\\]|failed|Failed|aborted"; then
    return 1
  fi
  return 0
}

echo "[INFO] Try with default proxy first: npm run $SCRIPT_NAME"
if run_and_check "proxy_on"; then
  echo "[INFO] Success with proxy ON"
  exit 0
fi

echo "[WARN] Proxy ON run failed, retrying with proxy OFF..."
if run_and_check "proxy_off"; then
  echo "[INFO] Success with proxy OFF"
  exit 0
fi

echo "[ERROR] Both proxy ON and proxy OFF runs failed"
exit 1
