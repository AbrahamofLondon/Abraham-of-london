#!/bin/bash

# --- CONFIGURATION ---
BASE_URL="http://localhost:3000"
BYPASS_KEY="your-secret-key-here" # Matches your .env
JWT_TOKEN="your-admin-jwt-here"

echo "🛡️  STARTING INSTITUTIONAL PERIMETER VERIFICATION"
echo "-----------------------------------------------"

# TEST 1: ADMIN PDF GENERATION (Tests exports.server.ts + audit-logger.ts)
echo "🧪 [TEST 1/3] Generating Intelligence Brief PDF..."
curl -X POST "$BASE_URL/api/admin/generate-pdf" \
     -H "Content-Type: application/json" \
     -H "X-Institutional-Action: ADMIN_SYNC" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{"id": "intelligence-brief-075", "options": {"includeWatermark": true, "force": true}}'
echo -e "\n"

# TEST 2: EMERGENCY BYPASS (Tests proxy.ts logic)
echo "🧪 [TEST 2/3] Testing Emergency Bypass Handshake..."
curl -I -X GET "$BASE_URL/admin/dashboard" \
     -H "X-Internal-Bypass-Key: $BYPASS_KEY"
echo -e "\n"

# TEST 3: CRON HYGIENE (Tests cron.ts + audit-logger.ts batching)
echo "🧪 [TEST 3/3] Triggering Institutional Hygiene..."
curl -X POST "$BASE_URL/api/cron/hygiene" \
     -H "Content-Type: application/json"
echo -e "\n"

echo "-----------------------------------------------"
echo "✅ Verification Sequence Complete."