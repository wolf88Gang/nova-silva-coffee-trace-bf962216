#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Post-migration verification via PostgREST + JWT
# Tests: onboarding persistence, gate condition, alert status RPC
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

SUPABASE_URL="https://qbwmsarqewxjuwgkdfmg.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps"

login() {
  curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${ANON_KEY}" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"demo123456\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])"
}

rpc() {
  curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/$1" \
    -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer $2" \
    -H "Content-Type: application/json" -d "$3"
}

rest() {
  curl -s -w "\n%{http_code}" "$@" -H "apikey: ${ANON_KEY}"
}

echo "=== Login tokens ==="
T_COOP=$(login "demo.cooperativa@novasilva.com")
T_EXP=$(login "demo.exportador@novasilva.com")
echo "cooperativa: ${T_COOP:0:20}..."
echo "exportador:  ${T_EXP:0:20}..."

echo ""
echo "=== TEST 1: rpc_upsert_org_profile_v2 (cooperativa) ==="
R=$(rpc rpc_upsert_org_profile_v2 "$T_COOP" '{"org_type":"cooperativa","activities":["produce","compra","procesa"],"crops":["cafe"],"season_start_month":10,"season_end_month":3}')
echo "Result: $R"

echo ""
echo "=== TEST 2: read back org profile (cooperativa) ==="
rest "${SUPABASE_URL}/rest/v1/organization_profile?select=*" -H "Authorization: Bearer ${T_COOP}" | head -n -1 | python3 -m json.tool 2>/dev/null || echo "FAILED"

echo ""
echo "=== TEST 3: cross-org read (exportador reads coop profile) ==="
R=$(rest "${SUPABASE_URL}/rest/v1/organization_profile?select=*" -H "Authorization: Bearer ${T_EXP}")
HTTP=$(echo "$R" | tail -1)
BODY=$(echo "$R" | head -n -1)
echo "HTTP $HTTP -- rows: $(echo "$BODY" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))' 2>/dev/null || echo 'error')"

echo ""
echo "=== TEST 4: rpc_update_setup_state_v2 (cooperativa) ==="
R=$(rpc rpc_update_setup_state_v2 "$T_COOP" '{"p_current_step":3,"p_completed":false,"p_completed_steps":[1,2]}')
echo "Result: $R"

echo ""
echo "=== TEST 5: gate condition -- is_completed=false ==="
rest "${SUPABASE_URL}/rest/v1/organization_setup_state?select=is_completed,current_step,completed_steps" -H "Authorization: Bearer ${T_COOP}" | head -n -1 | python3 -m json.tool 2>/dev/null

echo ""
echo "=== TEST 6: mark completed ==="
R=$(rpc rpc_update_setup_state_v2 "$T_COOP" '{"p_current_step":5,"p_completed":true,"p_completed_steps":[1,2,3,4,5]}')
echo "Result: $R"
rest "${SUPABASE_URL}/rest/v1/organization_setup_state?select=is_completed,completed_at" -H "Authorization: Bearer ${T_COOP}" | head -n -1 | python3 -m json.tool 2>/dev/null

echo ""
echo "=== TEST 7: rpc_set_alert_status -- needs admin to insert alert first ==="
echo "(Skipped -- agro_alerts INSERT requires admin role. Test after seeding an alert.)"

echo ""
echo "=== CLEANUP ==="
rest -X DELETE "${SUPABASE_URL}/rest/v1/organization_setup_state?organization_id=eq.00000000-0000-0000-0000-000000000001" -H "Authorization: Bearer ${T_COOP}" | tail -1
rest -X DELETE "${SUPABASE_URL}/rest/v1/organization_profile?organization_id=eq.00000000-0000-0000-0000-000000000001" -H "Authorization: Bearer ${T_COOP}" | tail -1
echo ""
echo "Done."
