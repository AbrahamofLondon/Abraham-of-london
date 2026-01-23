#!/usr/bin/env bash
# run-interactive-pdf.sh - Simple wrapper script
echo "🚀 Interactive PDF Generator"
echo "============================="

# Pass all arguments to the TypeScript file
npx tsx scripts/pdf/generate-interactive-pdf.ts "$@"
