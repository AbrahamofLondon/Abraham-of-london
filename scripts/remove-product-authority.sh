#!/bin/bash
# Remove ProductAuthority imports and JSX from all public pages

set -e

PAGES=(
  "pages/test-your-decision.tsx"
  "pages/report/[reportId].tsx"
  "pages/enterprise-decision-scan.tsx"
  "pages/diagnostics/executive-reporting/run.tsx"
  "pages/decision-instruments/team-alignment-gap-map/run.tsx"
  "pages/decision-instruments/strategic-priority-stack-builder/run.tsx"
  "pages/decision-instruments/structural-failure-diagnostic-canvas/run.tsx"
  "pages/decision-instruments/mandate-clarity-framework/run.tsx"
  "pages/decision-instruments/intervention-path-selector/run.tsx"
  "pages/decision-instruments/governance-drift-detector/run.tsx"
  "pages/decision-instruments/execution-risk-index/run.tsx"
  "pages/decision-instruments/escalation-readiness-scorecard/run.tsx"
  "pages/decision-instruments/decision-exposure-instrument/run.tsx"
  "pages/decision-instruments/board-brief-builder/run.tsx"
  "pages/checkout/personal-decision-audit.tsx"
  "pages/boardroom-brief.tsx"
  "pages/decision-centre.tsx"
)

echo "Removing ProductAuthority from public pages..."

for PAGE in "${PAGES[@]}"; do
  if [ ! -f "$PAGE" ]; then
    echo "⚠️  Skipping $PAGE (not found)"
    continue
  fi

  echo "Processing $PAGE..."

  # Remove ProductAuthority imports using sed
  sed -i '/import.*ProductAuthority/d' "$PAGE"
  sed -i '/import.*resolve-product-authority/d' "$PAGE"
  sed -i '/import.*getDefault.*ProductAuthority/d' "$PAGE"

  # Remove config/contract variable assignments
  sed -i '/const config = PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS/d' "$PAGE"
  sed -i '/const instrumentConfig = PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS/d' "$PAGE"
  sed -i '/const contract = config.*resolveProductAuthority/d' "$PAGE"
  sed -i '/const.*ProductAuthority.*resolveProductAuthority/d' "$PAGE"

  # Remove JSX blocks (more complex - handle wrapper divs)
  # This is approximate; manual review may be needed for edge cases
  sed -i '/{!result && contract.*$/,/^[[:space:]]*}}/d' "$PAGE"
  sed -i '/{!result && config.*$/,/^[[:space:]]*}}/d' "$PAGE"

done

echo "✅ ProductAuthority removal complete"
echo "⚠️  Manual review recommended for any edge cases"

# Verify removal
echo ""
echo "Verification:"
REMAINING=$(grep -r "ProductAuthority" pages/decision-instruments pages/diagnostics pages/checkout pages/test-your-decision.tsx pages/report pages/enterprise-decision-scan.tsx pages/boardroom-brief.tsx pages/decision-centre.tsx 2>/dev/null | wc -l)
echo "ProductAuthority references remaining: $REMAINING"

if [ "$REMAINING" -eq 0 ]; then
  echo "✅ All ProductAuthority components removed!"
else
  echo "⚠️  Some references remain - may need manual cleanup"
fi
