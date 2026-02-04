#!/usr/bin/env bash
# Configure Supabase Auth URL settings for local development
# Requires: SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)
# Add to .env: SUPABASE_ACCESS_TOKEN=sbp_xxx...

set -e

PROJECT_REF="kykeogkeeevaklihohsy"
SITE_URL="${SITE_URL:-http://localhost:5173}"
# Comma-separated redirect URLs (wildcards supported)
REDIRECT_URLS="${REDIRECT_URLS:-http://localhost:5173,http://localhost:5173/**}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-sbp_23f3ca85fbc9c4be13f56476ccc0b990d05c6af3}"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is required."
  echo "1. Go to https://supabase.com/dashboard/account/tokens"
  echo "2. Create a Personal Access Token"
  echo "3. Add to .env: SUPABASE_ACCESS_TOKEN=sbp_xxx"
  echo "4. Run: source .env 2>/dev/null || true; ./scripts/configure-supabase-auth.sh"
  exit 1
fi

echo "Configuring Supabase Auth for project $PROJECT_REF..."
echo "  Site URL: $SITE_URL"
echo "  Redirect URLs: $REDIRECT_URLS"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"site_url\": \"$SITE_URL\",
    \"uri_allow_list\": \"$REDIRECT_URLS\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "Done. Auth URL configuration updated successfully."
else
  echo "Error (HTTP $HTTP_CODE): $BODY"
  exit 1
fi
