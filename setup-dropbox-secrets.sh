#!/usr/bin/env bash
set -e

echo "This script helps configure Dropbox secrets for the Cloudflare Worker."

tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

read -rp "Dropbox APP KEY: " DROPBOX_APP_KEY
read -rp "Dropbox APP SECRET: " DROPBOX_APP_SECRET
read -rp "Dropbox REFRESH TOKEN: " DROPBOX_REFRESH_TOKEN
read -rp "(Optional) Static DROPBOX TOKEN (leave empty to skip): " DROPBOX_TOKEN

cat > "$tmpfile" <<EOF
DROPBOX_APP_KEY=$DROPBOX_APP_KEY
DROPBOX_APP_SECRET=$DROPBOX_APP_SECRET
DROPBOX_REFRESH_TOKEN=$DROPBOX_REFRESH_TOKEN
EOF

if [ -n "$DROPBOX_TOKEN" ]; then
  cat >> "$tmpfile" <<EOF
DROPBOX_TOKEN=$DROPBOX_TOKEN
EOF
fi

while IFS='=' read -r name value; do
  if [ -n "$value" ]; then
    echo "Setting secret: $name"
    printf "%s" "$value" | wrangler secret put "$name"
  fi
done < "$tmpfile"

echo "Dropbox secrets configured successfully. Run 'wrangler publish' after this."