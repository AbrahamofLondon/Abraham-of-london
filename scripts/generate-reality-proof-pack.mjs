/**
 * scripts/generate-reality-proof-pack.mjs
 *
 * Runs the Decision Intelligence Kernel against all 12 mandatory scenarios
 * and generates the Kernel Reality Proof Pack.
 *
 * Usage: node scripts/generate-reality-proof-pack.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.resolve(__dirname, '..', 'reports', 'kernel-reality-proof')

// We need to dynamically import the ESM modules
// Since vitest handles ESM, we'll write a test that generates the outputs

// This script generates the markdown/json scaffolding
// The actual kernel runs are done via vitest

const SCENARIOS = [
  {
    id: 'scenario-01-hmrc-filing-rescue',
    title: 'HMRC/Company Accounts Filing Rescue with No Funds',
    file: 'scenario-01-hmrc-filing-rescue',
  },
  {
    id: 'scenario-02-board-political-pressure',
    title: 'Board Decision Under Political Pressure',
    file: 'scenario-02-board-political-pressure',
  },
  {
    id: 'scenario-03-market-claim-weak-proof',
    title: 'Market Claim with Strong Copy but Weak Proof',
    file: 'scenario-03-market-claim-weak-proof',
  },
  {
    id: 'scenario-04-product-launch-revenue-pressure',
    title: 'Product Launch Under Revenue Pressure',
    file: 'scenario-04-product-launch-revenue-pressure',
  },
  {
    id: 'scenario-05-procurement-supplier-risk',
    title: 'Procurement Supplier Risk',
    file: 'scenario-05-procurement-supplier-risk',
  },
  {
    id: 'scenario-06-investor-pitch-unsupported-traction',
    title: 'Investor Pitch with Unsupported Traction',
    file: 'scenario-06-investor-pitch-unsupported-traction',
  },
  {
    id: 'scenario-07-operational-failure-unclear-owner',
    title: 'Operational Failure with Unclear Owner',
    file: 'scenario-07-operational-failure-unclear-owner',
  },
  {
    id: 'scenario-08-legal-admin-deadline',
    title: 'Legal/Admin/Family Deadline',
    file: 'scenario-08-legal-admin-deadline',
  },
  {
    id: 'scenario-09-cash-constrained-survival',
    title: 'Cash-Constrained Survival',
    file: 'scenario-09-cash-constrained-survival',
  },
  {
    id: 'scenario-10-strategic-asymmetric-partnership',
    title: 'Strategic Asymmetric Partnership',
    file: 'scenario-10-strategic-asymmetric-partnership',
  },
  {
    id: 'scenario-11-executive-reputational-exposure',
    title: 'Executive Reputational Exposure',
    file: 'scenario-11-executive-reputational-exposure',
  },
  {
    id: 'scenario-12-low-stakes-preference',
    title: 'Low-Stakes Preference',
    file: 'scenario-12-low-stakes-preference',
  },
]

// Create index.md
function generateIndex(scenarios) {
  return `# Kernel Reality Proof Pack

**Generated:** ${new Date().toISOString().split('T')[0]}
**Kernel Version:** 1.0.0
**Contract Version:** 1.0.0
**Ontology Version:** 1.0.0

## Purpose

This proof pack demonstrates whether the new Decision Intelligence Kernel can produce category-grade outputs across the 12 mandatory scenarios. It is not a marketing document. It is a hostile review of the kernel's judgement.

## Scenarios

${scenarios.map(s => `| [${s.title}](${s.file}.md) | [JSON](${s.file}.json) |`).join('\n')}

## Summary

See [summary.md](summary.md) for the overall verdict.

## How to Read

Each scenario contains:
1. Raw user situation
2. Vocabulary state
3. Kernel interpretation
4. Classification
5. Actor/authority/obligation/constraint/evidence maps
6. Adversarial and self-adversarial challenges
7. Regulated boundary state
8. Minimum viable path
9. Forbidden actions
10. Free Signal, Basic Brief, and Full Dossier outputs
11. Quality rubric with PASS/FAIL verdicts

## Non-Negotiables

- No generic paid output
- No alternative class missing where ambiguity exists
- No high-consequence case without adversarial challenge
- No regulated boundary crossed
- No low-stakes case overengineered
- No missing minimum viable path
- No output that could apply to ten different situations
- No self-adversarial challenge missing in Full Dossier
- No human review absent where required
`
}

// Generate the index
const indexContent = generateIndex(SCENARIOS)
fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent)
console.log('✓ Generated index.md')

// Generate placeholder scenario files
for (const scenario of SCENARIOS) {
  const mdPath = path.join(outputDir, `${scenario.file}.md`)
  const jsonPath = path.join(outputDir, `${scenario.file}.json`)

  if (!fs.existsSync(mdPath)) {
    fs.writeFileSync(mdPath, `# ${scenario.title}\n\n**Status:** Pending kernel execution\n\n*Run the proof pack test suite to populate this file.*\n`)
    console.log(`  Created placeholder: ${scenario.file}.md`)
  }

  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(jsonPath, JSON.stringify({ scenario: scenario.id, status: 'pending' }, null, 2))
    console.log(`  Created placeholder: ${scenario.file}.json`)
  }
}

// Generate summary placeholder
const summaryPath = path.join(outputDir, 'summary.md')
if (!fs.existsSync(summaryPath)) {
  fs.writeFileSync(summaryPath, `# Kernel Reality Proof Pack — Summary

**Generated:** ${new Date().toISOString().split('T')[0]}

## Overview

| Metric | Value |
|---|---|
| Scenarios passed | 0 / 12 |
| Scenarios failed | 0 / 12 |
| Strongest scenario | — |
| Weakest scenario | — |
| Readiness verdict | NOT_READY |

*Run the proof pack test suite to populate this summary.*

## Recurring Patterns

*To be filled after kernel execution.*

## Verdict

**NOT_READY** — The kernel must prove its outputs before any public rewiring.
`)
  console.log('  Created placeholder: summary.md')
}

console.log('\n✓ Proof pack scaffolding complete')
console.log('Run the proof pack test suite to populate the outputs:')
console.log('  npx vitest run tests/product/kernel-reality-proof.spec.ts')
