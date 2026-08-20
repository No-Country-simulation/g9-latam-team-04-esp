#!/bin/sh

set -eu

target_file="/usr/share/nginx/html/env-config.js"
backend_url="${TK_BE_URL:-http://localhost:8000}"

cat > "$target_file" <<EOF
window.TECHMIND_API_BASE = "$backend_url";
EOF