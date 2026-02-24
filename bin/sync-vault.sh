#!/bin/bash

# --- PRE-FLIGHT ---
echo "🏛️  INITIATING MASTER VAULT SYNC..."
mkdir -p ./logs/vault
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="./logs/vault/sync_$TIMESTAMP.log"

# --- EXECUTION ---
# Allocate 8GB of RAM to the Node process to handle parallel PDF rendering
# 'tsx' handles the .ts / .mjs interop identified in your build errors
NODE_OPTIONS="--max-old-space-size=8192 --no-warnings" \
npx tsx scripts/vault-master.ts 2>&1 | tee $LOG_FILE

# --- POST-FLIGHT ---
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ SYNC COMPLETE. Audit log saved to: $LOG_FILE"
else
  echo "🚨 SYNC FAILED. Check logs for reconciliation errors."
  exit 1
fi