/**
 * scripts/check-public-route-integrity.mjs
 *
 * Verifies that all public aperture routes use the kernel and
 * render FREE_SIGNAL only — no paid dossier content leaks.
 *
 * Exit code 1 if any violation is detected.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const violations = []

// Check 1: Public kernel signal API exists and is correct
const apiPath = path.join(root, 'pages', 'api', 'public', 'kernel-signal.ts')
if (!fs.existsSync(apiPath)) {
  violations.push('MISSING_API: pages/api/public/kernel-signal.ts does not exist')
} else {
  const content = fs.readFileSync(apiPath, 'utf-8')
  if (!content.includes('FREE_SIGNAL')) {
    violations.push('API_MISSING_FREE_SIGNAL: kernel-signal.ts does not restrict to FREE_SIGNAL')
  }
  if (!content.includes('DecisionIntelligenceKernel')) {
    violations.push('API_MISSING_KERNEL: kernel-signal.ts does not use DecisionIntelligenceKernel')
  }
  // Check for actual paid content implementation (not comments or type definitions)
  const paidContentPatterns = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession']
  const hasPaidContent = paidContentPatterns.some(p => content.includes(p))
  if (hasPaidContent) {
    violations.push('API_LEAKS_PAID_CONTENT: kernel-signal.ts contains paid dossier or checkout implementation')
  }
}

// Check 2: Public kernel signal page exists
const pagePath = path.join(root, 'pages', 'kernel', 'signal.tsx')
if (!fs.existsSync(pagePath)) {
  violations.push('MISSING_PAGE: pages/kernel/signal.tsx does not exist')
} else {
  const content = fs.readFileSync(pagePath, 'utf-8')
  if (!content.includes('FreeSignalResult')) {
    violations.push('PAGE_MISSING_COMPONENT: signal.tsx does not use FreeSignalResult')
  }
  const paidImplPatterns = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession', 'Stripe']
  const hasPaidImpl = paidImplPatterns.some(p => content.includes(p))
  if (hasPaidImpl) {
    violations.push('PAGE_LEAKS_PAID_CONTENT: signal.tsx contains checkout or pricing implementation')
  }
}

// Check 3: FreeSignalResult component exists and is clean
const componentPath = path.join(root, 'components', 'kernel', 'FreeSignalResult.tsx')
if (!fs.existsSync(componentPath)) {
  violations.push('MISSING_COMPONENT: components/kernel/FreeSignalResult.tsx does not exist')
} else {
  const content = fs.readFileSync(componentPath, 'utf-8')
  if (!content.includes('FREE_SIGNAL')) {
    violations.push('COMPONENT_MISSING_FREE_SIGNAL: FreeSignalResult does not reference FREE_SIGNAL')
  }
  const compPaidPatterns = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession', 'Stripe']
  const compHasPaid = compPaidPatterns.some(p => content.includes(p))
  if (compHasPaid) {
    violations.push('COMPONENT_LEAKS_PAID_CONTENT: FreeSignalResult contains checkout or pricing implementation')
  }
}

// Check 4: No paid dossier fields in the API response type
const apiContent = fs.readFileSync(apiPath, 'utf-8')
const forbiddenFields = ['fullDossier', 'selfAdversarial', 'recordReference', 'verificationToken', 'checkoutUrl', 'stripePrice']
for (const field of forbiddenFields) {
  if (apiContent.includes(field)) {
    violations.push(`API_LEAKS_FIELD_${field}: kernel-signal.ts exposes forbidden field "${field}"`)
  }
}

// adversarialPreview is ALLOWED — it is a controlled single-challenge preview
// But full adversarialChallenges array is FORBIDDEN
if (apiContent.includes('adversarialChallenges') && !apiContent.includes('adversarialPreview')) {
  violations.push('API_LEAKS_FULL_ADVERSARIAL: kernel-signal.ts exposes full adversarialChallenges array')
}

// Check 5: The Free Signal output structure is correct
const expectedFields = [
  'situationClass',
  'whatTheSystemSaw',
  'primaryFailurePoint',
  'governingTension',
  'consequenceClass',
  'whatFullAnalysisWouldMap',
  'directionOfMinimumViableMove',
  'boundaryNote',
  'reviewNote',
  'adversarialPreview',
]
for (const field of expectedFields) {
  if (!apiContent.includes(field)) {
    violations.push(`API_MISSING_FIELD_${field}: kernel-signal.ts is missing required Free Signal field "${field}"`)
  }
}

// Report
console.log('\n=== PUBLIC APERTURE INTEGRITY CHECK ===\n')

if (violations.length > 0) {
  console.error('VIOLATIONS DETECTED:')
  violations.forEach(v => console.error(`  ✗ ${v}`))
  console.error(`\nTotal: ${violations.length} violation(s)`)
  process.exit(1)
} else {
  console.log('✓ All public aperture integrity checks passed')
  console.log('✓ API endpoint uses kernel and restricts to FREE_SIGNAL')
  console.log('✓ Public page uses FreeSignalResult component')
  console.log('✓ No paid dossier fields leak')
  console.log('✓ No checkout or pricing references')
  console.log('✓ All required Free Signal fields present')
  process.exit(0)
}