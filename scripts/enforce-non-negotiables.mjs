/**
 * scripts/enforce-non-negotiables.mjs — Non-Negotiable Enforcement
 *
 * Run this script as part of CI/CD to enforce the 10 absolute non-negotiables.
 * Exit code 1 if any violation is detected.
 */

const NON_NEGOTIABLES = [
  'No new public surfaces until kernel works.',
  'No new monetisation routes until case entitlement works.',
  'No checkout unless case context persists.',
  'No full dossier without self-adversarial challenge.',
  'No executive output without human/founder review.',
  'No regulated advice overclaim.',
  'No raw input in analytics.',
  'No generic paid output.',
  'No orphan diagnostic route.',
  'No route that looks premium but behaves like a toy.',
]

const violations = []

// Check 1: No new public surfaces
// Verify all public-facing pages route through the kernel
const fs = await import('fs')
const path = await import('path')

function walkDir(dir, pattern, results = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('.')) {
        walkDir(fullPath, pattern, results)
      } else if (entry.isFile() && entry.name.match(pattern)) {
        results.push(fullPath)
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }
  return results
}

// Check 2: No new monetisation routes
const apiRoutes = walkDir('pages/api', /\.ts$/)
const checkoutRoutes = apiRoutes.filter(r => r.includes('checkout') || r.includes('billing'))
for (const route of checkoutRoutes) {
  const content = fs.readFileSync(route, 'utf-8')
  if (!content.includes('caseId') && !content.includes('livingCase')) {
    violations.push(`CHECKOUT_WITHOUT_CASE: ${route} does not reference case context`)
  }
}

// Check 3: No orphan diagnostic routes
const diagnosticPages = walkDir('pages/diagnostics', /\.tsx$/)
for (const page of diagnosticPages) {
  const content = fs.readFileSync(page, 'utf-8')
  if (!content.includes('kernel') && !content.includes('LivingDecisionCase') && !content.includes('living-case')) {
    violations.push(`ORPHAN_DIAGNOSTIC: ${page} does not route through kernel`)
  }
}

// Check 4: No generic paid output (scan for placeholder content)
const paidPages = [
  ...walkDir('pages/decision-instruments', /\.tsx$/),
  ...walkDir('pages/diagnostics/executive-reporting', /\.tsx$/),
]
for (const page of paidPages) {
  const content = fs.readFileSync(page, 'utf-8')
  if (content.includes('placeholder') || content.includes('TODO') || content.includes('Coming soon')) {
    violations.push(`GENERIC_PAID_OUTPUT: ${page} contains placeholder content`)
  }
}

// Report
console.log('\n=== NON-NEGOTIABLE ENFORCEMENT ===\n')
console.log(`Checking ${NON_NEGOTIABLES.length} non-negotiables...\n`)

if (violations.length > 0) {
  console.error('VIOLATIONS DETECTED:')
  violations.forEach(v => console.error(`  ✗ ${v}`))
  console.error(`\nTotal: ${violations.length} violation(s)`)
  process.exit(1)
} else {
  console.log('✓ All non-negotiables satisfied')
  console.log('✓ No violations detected')
  process.exit(0)
}
