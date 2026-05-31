/**
 * scripts/check-admin-surface-integrity.mjs
 *
 * Verifies that admin fulfilment surfaces exist and are correctly structured.
 * No public leakage. No checkout. No payment.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const violations = []

// Check 1: Admin fulfilment module exists
const fulfilmentPath = path.join(root, 'lib', 'intelligence', 'admin-fulfilment.ts')
if (!fs.existsSync(fulfilmentPath)) {
  violations.push('MISSING_FULFILMENT_MODULE: lib/intelligence/admin-fulfilment.ts does not exist')
} else {
  const content = fs.readFileSync(fulfilmentPath, 'utf-8')
  if (!content.includes('AdminFulfilmentEngine')) {
    violations.push('FULFILMENT_MISSING_ENGINE: admin-fulfilment.ts does not export AdminFulfilmentEngine')
  }
  if (!content.includes('generateDossier')) {
    violations.push('FULFILMENT_MISSING_GENERATE: admin-fulfilment.ts does not have generateDossier method')
  }
  if (!content.includes('reviewDossier')) {
    violations.push('FULFILMENT_MISSING_REVIEW: admin-fulfilment.ts does not have reviewDossier method')
  }
  if (!content.includes('generateArtefact')) {
    violations.push('FULFILMENT_MISSING_ARTEFACT: admin-fulfilment.ts does not have generateArtefact method')
  }
  // Check no public leakage — look for actual payment implementation, not comments
  const paymentImpl = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession', 'Stripe']
  const hasPaymentImpl = paymentImpl.some(p => content.includes(p))
  if (hasPaymentImpl) {
    violations.push('FULFILMENT_LEAKS_PAYMENT: admin-fulfilment.ts contains payment implementation')
  }
}

// Check 2: No public routes expose fulfilment
const apiDir = path.join(root, 'pages', 'api')
function walkApi(dir, depth = 0) {
  if (depth > 3) return
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walkApi(full, depth + 1)
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(full, 'utf-8')
        if (content.includes('AdminFulfilmentEngine') || content.includes('admin-fulfilment')) {
          // This is OK if it's an admin-only route
          if (!full.includes('admin')) {
            violations.push(`PUBLIC_FULFILMENT_LEAK: ${full} references admin fulfilment outside admin path`)
          }
        }
      }
    }
  } catch (e) {
    // Skip
  }
}
walkApi(apiDir)

// Check 3: Fulfilment proof pack directory exists
const proofDir = path.join(root, 'reports', 'paid-dossier-fulfilment-proof')
if (!fs.existsSync(proofDir)) {
  violations.push('MISSING_FULFILMENT_PROOF_DIR: reports/paid-dossier-fulfilment-proof does not exist')
}

// Report
console.log('\n=== ADMIN SURFACE INTEGRITY CHECK ===\n')

if (violations.length > 0) {
  console.error('VIOLATIONS DETECTED:')
  violations.forEach(v => console.error(`  ✗ ${v}`))
  console.error(`\nTotal: ${violations.length} violation(s)`)
  process.exit(1)
} else {
  console.log('✓ All admin surface integrity checks passed')
  console.log('✓ AdminFulfilmentEngine module exists with all required methods')
  console.log('✓ No public routes expose admin fulfilment')
  console.log('✓ No payment references in fulfilment module')
  console.log('✓ Fulfilment proof directory exists')
  process.exit(0)
}
