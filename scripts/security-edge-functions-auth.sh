#!/usr/bin/env bash
set -u

SUPABASE_URL_VALUE="${SUPABASE_URL:-${EXPO_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_KEY_VALUE="${SUPABASE_ANON_KEY:-${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}}}"

if [ -z "$SUPABASE_URL_VALUE" ] || [ -z "$SUPABASE_KEY_VALUE" ]; then
  echo "Missing SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL or SUPABASE_ANON_KEY/EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  echo "Example:"
  echo "  SUPABASE_URL=https://project.supabase.co SUPABASE_ANON_KEY=... bash scripts/security-edge-functions-auth.sh"
  exit 1
fi

functions=(
  "delete-account"
  "premium-upgrade-sync"
  "validate-and-upload-import"
)

failures=0

check_status() {
  local function_name="$1"
  local case_name="$2"
  local status="$3"

  if [ "$status" = "401" ] || [ "$status" = "403" ]; then
    echo "PASS $function_name $case_name rejected with HTTP $status"
  else
    echo "FAIL $function_name $case_name returned HTTP $status"
    failures=$((failures + 1))
  fi
}

for function_name in "${functions[@]}"; do
  url="$SUPABASE_URL_VALUE/functions/v1/$function_name"

  missing_auth_status="$(curl -sS -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "apikey: $SUPABASE_KEY_VALUE" \
    -H "Content-Type: application/json" \
    --data '{"securityTest":true}' \
    "$url")"
  check_status "$function_name" "missing-auth" "$missing_auth_status"

  invalid_auth_status="$(curl -sS -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "apikey: $SUPABASE_KEY_VALUE" \
    -H "Authorization: Bearer invalid.security.test.token" \
    -H "Content-Type: application/json" \
    --data '{"securityTest":true}' \
    "$url")"
  check_status "$function_name" "invalid-token" "$invalid_auth_status"
done

if [ "$failures" -gt 0 ]; then
  echo "$failures Edge Function auth test(s) failed."
  exit 1
fi

echo "All Edge Function auth tests passed."
