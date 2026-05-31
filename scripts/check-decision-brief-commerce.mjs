/**
 * scripts/check-decision-brief-commerce.mjs
 *
 * Verifies that the checkout entitlement flow is correctly structured.
 * No public leakage. No auto-delivery. No bypass of human review.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const violations = []

// Check 1: Checkout entitlement module exists
const entitlementPath = path.join(root, 'lib', 'commercial', 'checkout-entitlement.ts')
if (!fs.existsSync(entitlementPath)) {
  violations.push('MISSING_ENTITLEMENT_MODULE: lib/commercial/checkout-entitlement.ts does not exist')
} else {
  const content = fs.readFileSync(entitlementPath, 'utf-8')
  const requiredExports = ['buildStripeMetadata', 'validateCheckoutRequest', 'createEntitlement', 'createFulfilmentItem', 'getFulfilmentQueue']
  for (const exp of requiredExports) {
    if (!content.includes(`export function ${exp}`) && !content.includes(`export const ${exp}`)) {
      violations.push(`MISSING_EXPORT: checkout-entitlement.ts does not export ${exp}`)
    }
  }
}

// Check 2: Checkout API route exists
const checkoutRoute = path.join(root, 'app', 'api', 'checkout', 'living-case', 'route.ts')
if (!fs.existsSync(checkoutRoute)) {
  violations.push('MISSING_CHECKOUT_ROUTE: app/api/checkout/living-case/route.ts does not exist')
} else {
  const content = fs.readFileSync(checkoutRoute, 'utf-8')
  if (!content.includes('caseId')) {
    violations.push('CHECKOUT_MISSING_CASE_ID: checkout route does not reference caseId')
  }
  if (!content.includes('tier')) {
    violations.push('CHECKOUT_MISSING_TIER: checkout route does not reference tier')
  }
}

// Check 3: Checkout confirm route exists
const confirmRoute = path.join(root, 'app', 'api', 'checkout', 'living-case-confirm', 'route.ts')
if (!fs.existsSync(confirmRoute)) {
  violations.push('MISSING_CONFIRM_ROUTE: app/api/checkout/living-case-confirm/route.ts does not exist')
} else {
  const content = fs.readFileSync(confirmRoute, 'utf-8')
  if (!content.includes('createEntitlement')) {
    violations.push('CONFIRM_MISSING_ENTITLEMENT: confirm route does not create entitlement')
  }
  if (!content.includes('createFulfilmentItem')) {
    violations.push('CONFIRM_MISSING_FULFILMENT: confirm route does not create fulfilment item')
  }
}

// Check 4: Success page exists
const successPage = path.join(root, 'app', 'foundry', 'case', 'success', 'page.tsx')
if (!fs.existsSync(successPage)) {
  violations.push('MISSING_SUCCESS_PAGE: app/foundry/case/success/page.tsx does not exist')
} else {
  const content = fs.readFileSync(successPage, 'utf-8')
  if (!content.includes('received for review')) {
    violations.push('SUCCESS_MISSING_REVIEW_MESSAGE: success page does not mention review')
  }
  if (content.includes('dossier') && content.includes('download') || content.includes('here is your')) {
    violations.push('SUCCESS_AUTO_DELIVERY: success page appears to auto-deliver dossier')
  }
}

// Check 5: No raw scenario text in Stripe metadata
const metadataContent = fs.readFileSync(entitlementPath, 'utf-8')
if (metadataContent.includes('rawScenario') || metadataContent.includes('rawContext')) {
  violations.push('METADATA_LEAKS_RAW_INPUT: Stripe metadata contains raw scenario text')
}

// Check 6: Checkout tests exist
const testPath = path.join(root, 'tests', 'product', 'checkout-entitlement.spec.ts')
if (!fs.existsSync(testPath)) {
  violations.push('MISSING_CHECKOUT_TESTS: tests/product/checkout-entitlement.spec.ts does not exist')
}

// Report
console.log('\n=== DECISION BRIEF COMMERCE CHECK ===\n')

if (violations.length > 0) {
  console.error('VIOLATIONS DETECTED:')
  violations.forEach(v => console.error(`  ✗ ${v}`))
  console.error(`\nTotal: ${violations.length} violation(s)`)
  process.exit(1)
} else {
  console.log('✓ All commerce checks passed')
  console.log('✓ Checkout entitlement module exists with all required exports')
  console.log('✓ Checkout API route exists with caseId and tier')
  console.log('✓ Confirm route creates entitlement and fulfilment item')
  console.log('✓ Success page mentions review (no auto-delivery)')
  console.log('✓ No raw scenario text in Stripe metadata')
  console.log('✓ Checkout tests exist')
  process.exit(0)
}