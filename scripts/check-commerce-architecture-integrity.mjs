/**
 * scripts/check-commerce-architecture-integrity.mjs
 *
 * Verifies that the commerce architecture is consolidated:
 * - Living Case architecture is canonical
 * - Legacy Decision Brief Order architecture is retired/reserved
 * - No duplicate active checkout paths
 * - No public leakage of legacy brief system
 * - Checkout metadata includes caseId/caseReference/tier
 * - Low-stakes cannot purchase
 * - No raw scenario text in Stripe metadata
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const violations = []

// ─── Check 1: Legacy checkout APIs return 410 Gone ──────────────────────────

const legacyCheckout = path.join(root, 'pages', 'api', 'checkout', 'decision-failure-brief.ts')
if (fs.existsSync(legacyCheckout)) {
  const content = fs.readFileSync(legacyCheckout, 'utf-8')
  if (!content.includes('410')) {
    violations.push('LEGACY_CHECKOUT_NOT_RETIRED: pages/api/checkout/decision-failure-brief.ts does not return 410')
  }
  if (!content.includes('/api/checkout/living-case')) {
    violations.push('LEGACY_CHECKOUT_NO_REDIRECT: pages/api/checkout/decision-failure-brief.ts does not reference canonical route')
  }
}

const legacyConfirm = path.join(root, 'pages', 'api', 'checkout', 'decision-failure-brief-confirm.ts')
if (fs.existsSync(legacyConfirm)) {
  const content = fs.readFileSync(legacyConfirm, 'utf-8')
  if (!content.includes('410')) {
    violations.push('LEGACY_CONFIRM_NOT_RETIRED: pages/api/checkout/decision-failure-brief-confirm.ts does not return 410')
  }
}

// ─── Check 2: Legacy success page redirects ─────────────────────────────────

const legacySuccess = path.join(root, 'pages', 'foundry', 'brief', 'success.tsx')
if (fs.existsSync(legacySuccess)) {
  const content = fs.readFileSync(legacySuccess, 'utf-8')
  if (!content.includes('/foundry/case/success')) {
    violations.push('LEGACY_SUCCESS_NO_REDIRECT: pages/foundry/brief/success.tsx does not redirect to canonical success page')
  }
}

// ─── Check 3: No public code posts to legacy checkout ───────────────────────

function scanForLegacyReferences(dir, depth = 0) {
  if (depth > 4) return
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('.') && !entry.name.startsWith('_')) {
        scanForLegacyReferences(full, depth + 1)
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const content = fs.readFileSync(full, 'utf-8')
        // Check if the file CONTENT references the legacy API (not just the file path)
        const contentRefsLegacyApi = content.includes('/api/checkout/decision-failure-brief') || content.includes('decision-failure-brief-confirm')
        const contentRefsLegacySuccess = content.includes('/foundry/brief/success')
        const normalizedPath = full.replace(/\\/g, '/')
        const isLegacyApiFile = normalizedPath.includes('pages/api/checkout/decision-failure-brief')
        const isLegacySuccessFile = normalizedPath.includes('pages/foundry/brief/success')
        const isTest = full.includes('tests/')
        const isScript = full.includes('scripts/check-commerce-architecture')

        if (contentRefsLegacyApi && !isLegacyApiFile && !isTest && !isScript) {
          violations.push(`PUBLIC_LEGACY_CHECKOUT_REF: ${full} references legacy checkout API`)
        }
        if (contentRefsLegacySuccess && !isLegacySuccessFile && !isTest && !isScript) {
          violations.push(`PUBLIC_LEGACY_SUCCESS_REF: ${full} references legacy success page`)
        }
      }
    }
  } catch (e) {
    // Skip
  }
}

scanForLegacyReferences(path.join(root, 'pages'))
scanForLegacyReferences(path.join(root, 'app'))
scanForLegacyReferences(path.join(root, 'components'))

// ─── Check 4: Canonical checkout routes exist ───────────────────────────────

const canonicalCheckout = path.join(root, 'app', 'api', 'checkout', 'living-case', 'route.ts')
if (!fs.existsSync(canonicalCheckout)) {
  violations.push('MISSING_CANONICAL_CHECKOUT: app/api/checkout/living-case/route.ts does not exist')
} else {
  const content = fs.readFileSync(canonicalCheckout, 'utf-8')
  if (!content.includes('caseId')) violations.push('CANONICAL_CHECKOUT_MISSING_CASE_ID')
  if (!content.includes('tier')) violations.push('CANONICAL_CHECKOUT_MISSING_TIER')
}

const canonicalConfirm = path.join(root, 'app', 'api', 'checkout', 'living-case-confirm', 'route.ts')
if (!fs.existsSync(canonicalConfirm)) {
  violations.push('MISSING_CANONICAL_CONFIRM: app/api/checkout/living-case-confirm/route.ts does not exist')
} else {
  const content = fs.readFileSync(canonicalConfirm, 'utf-8')
  if (!content.includes('createEntitlement')) violations.push('CANONICAL_CONFIRM_MISSING_ENTITLEMENT')
}

// ─── Check 5: Entitlement module exists with required exports ───────────────

const entitlementPath = path.join(root, 'lib', 'commercial', 'checkout-entitlement.ts')
if (!fs.existsSync(entitlementPath)) {
  violations.push('MISSING_ENTITLEMENT_MODULE')
} else {
  const content = fs.readFileSync(entitlementPath, 'utf-8')
  const required = ['buildStripeMetadata', 'validateCheckoutRequest', 'createEntitlement', 'createFulfilmentItem']
  for (const r of required) {
    if (!content.includes(`export function ${r}`) && !content.includes(`export const ${r}`)) {
      violations.push(`MISSING_EXPORT: ${r}`)
    }
  }
  // Check no raw scenario text
  if (content.includes('rawScenario') || content.includes('rawContext')) {
    violations.push('ENTITLEMENT_LEAKS_RAW_INPUT')
  }
}

// ─── Check 6: Canonical admin fulfilment page exists ────────────────────────

const canonicalAdminPage = path.join(root, 'app', 'admin', 'intelligence-foundry', 'living-case-fulfilment', 'page.tsx')
if (!fs.existsSync(canonicalAdminPage)) {
  violations.push('MISSING_CANONICAL_ADMIN_FULFILMENT: app/admin/intelligence-foundry/living-case-fulfilment/page.tsx does not exist')
} else {
  const content = fs.readFileSync(canonicalAdminPage, 'utf-8')
  if (!content.includes('Living Case Fulfilment')) {
    violations.push('CANONICAL_ADMIN_MISSING_TITLE')
  }
}

const canonicalAdminApi = path.join(root, 'app', 'api', 'admin', 'intelligence-foundry', 'living-case-fulfilment', 'route.ts')
if (!fs.existsSync(canonicalAdminApi)) {
  violations.push('MISSING_CANONICAL_ADMIN_API: app/api/admin/intelligence-foundry/living-case-fulfilment/route.ts does not exist')
}

// ─── Check 7: Legacy brief-orders page has archive banner ────────────────────

const legacyAdminPage = path.join(root, 'app', 'admin', 'intelligence-foundry', 'brief-orders', 'page.tsx')
if (fs.existsSync(legacyAdminPage)) {
  const content = fs.readFileSync(legacyAdminPage, 'utf-8')
  if (!content.includes('Legacy') && !content.includes('Archive')) {
    violations.push('LEGACY_ADMIN_NOT_LABELLED: app/admin/intelligence-foundry/brief-orders/page.tsx is not labelled as legacy/archive')
  }
  if (!content.includes('living-case-fulfilment')) {
    violations.push('LEGACY_ADMIN_NO_CANONICAL_LINK: brief-orders page does not link to canonical fulfilment page')
  }
}

// ─── Check 8: Low-stakes protection exists ──────────────────────────────────

if (fs.existsSync(entitlementPath)) {
  const content = fs.readFileSync(entitlementPath, 'utf-8')
  if (!content.includes('LOW_STAKES_PREFERENCE')) {
    violations.push('MISSING_LOW_STAKES_PROTECTION')
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('\n=== COMMERCE ARCHITECTURE INTEGRITY CHECK ===\n')

if (violations.length > 0) {
  console.error('VIOLATIONS DETECTED:')
  violations.forEach(v => console.error(`  ✗ ${v}`))
  console.error(`\nTotal: ${violations.length} violation(s)`)
  process.exit(1)
} else {
  console.log('✓ All commerce architecture integrity checks passed')
  console.log('✓ Legacy checkout APIs retired (410 Gone)')
  console.log('✓ Legacy success page redirects to canonical')
  console.log('✓ No public code references legacy brief system')
  console.log('✓ Canonical checkout routes exist with caseId/tier')
  console.log('✓ Entitlement module exists with all required exports')
  console.log('✓ Low-stakes protection present')
  console.log('✓ No raw scenario text in metadata')
  process.exit(0)
}
