#!/usr/bin/env bash
set -euo pipefail

# Default proxy profile for this machine.
export http_proxy="http://127.0.0.1:10808"
export https_proxy="http://127.0.0.1:10808"
export all_proxy="socks5://127.0.0.1:10808"
export HTTP_PROXY="$http_proxy"
export HTTPS_PROXY="$https_proxy"
export ALL_PROXY="$all_proxy"

# Keep local addresses direct; do not include Irys here so MCP can use proxy.
export NO_PROXY="127.0.0.1,localhost"
export no_proxy="$NO_PROXY"

echo "[INFO] Proxy ON"
echo "http_proxy=$http_proxy"
echo "https_proxy=$https_proxy"
echo "all_proxy=$all_proxy"
