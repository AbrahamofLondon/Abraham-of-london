#!/bin/bash

# ==============================================================================
# ABRAHAM OF LONDON: STRATEGIC AUDIT RETRIEVAL (SAR)
# Purpose: Securely exports system logs from production to local CSV.
# ==============================================================================

# 1. Institutional Configuration
API_URL="https://abrahamoflondon.org/api/admin/export-audit"
AUTH_KEY="your_admin_api_key_here" # Matches process.env.ADMIN_API_KEY
OUTPUT_FILE="audit_export_$(date +%Y%m%d_%H%M%S).csv"

# 2. Parameter Setup (Default: Last 7 days)
SINCE=$(date -v-7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date --date="7 days ago" +%Y-%m-%dT%H:%M:%SZ)

echo "----------------------------------------------------"
echo "Starting Institutional Audit Retrieval..."
echo "Target: $API_URL"
echo "Period Since: $SINCE"
echo "----------------------------------------------------"

# 3. Execution via cURL
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL?since=$SINCE" \
  -H "Authorization: Bearer $AUTH_KEY" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

# 4. Outcome Verification
if [ "$HTTP_STATUS" -ne 200 ]; then
    echo "❌ [ERROR] Retrieval Failed with Status: $HTTP_STATUS"
    echo "Response: $BODY"
    exit 1
fi

# 5. CSV Transformation (Requires 'jq')
# This logic maps the JSON keys directly to a structured CSV format.
echo "✅ Success. Transforming to CSV..."

echo "Timestamp,ActorType,ActorEmail,Action,ResourceType,Status,IPAddress,RequestID" > "$OUTPUT_FILE"
echo "$BODY" | jq -r '.data[] | [
  .createdAt,
  .actorType,
  .actorEmail,
  .action,
  .resourceType,
  .status,
  .ipAddress,
  .requestId
] | @csv' >> "$OUTPUT_FILE"

echo "----------------------------------------------------"
echo "REPORT COMPLETE"
echo "Saved to: $OUTPUT_FILE"
echo "----------------------------------------------------"