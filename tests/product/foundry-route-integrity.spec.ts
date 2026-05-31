/**
 * tests/product/foundry-route-integrity.spec.ts — Foundry Route Integrity Tests
 *
 * Confirms that all Foundry public aperture pages use the kernel signal path
 * and render FREE_SIGNAL only. No old local diagnostic engines remain active
 * as primary public result paths. No checkout/pricing in public result paths.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..', '..')

function readPage(filePath: string): string {
  const fullPath = path.join(ROOT, filePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Foundry Route Integrity', () => {
  // ─── Test 1: decision-test uses kernel signal ──────────────────────────────

  it('should import or call the kernel signal path', () => {
    const content = readPage('pages/foundry/decision-test.tsx')
    expect(content).toContain('useKernelSignal')
    expect(content).toContain('/api/public/kernel-signal')
    expect(content).toContain('FreeSignalResult')
  })

  it('should not use the old local diagnostic engine', () => {
    const content = readPage('pages/foundry/decision-test.tsx')
    expect(content).not.toContain('analyzeDecisionFailureMap')
    expect(content).not.toContain('decision-failure-map')
  })

  it('should not contain checkout or pricing', () => {
    const content = readPage('pages/foundry/decision-test.tsx')
    const paidPatterns = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession', 'Stripe']
    for (const pattern of paidPatterns) {
      expect(content).not.toContain(pattern)
    }
  })

  // ─── Test 2: market-signal-test uses kernel signal ─────────────────────────

  it('should import or call the kernel signal path', () => {
    const content = readPage('pages/foundry/market-signal-test.tsx')
    expect(content).toContain('useKernelSignal')
    expect(content).toContain('FreeSignalResult')
  })

  it('should not use the old local diagnostic engine', () => {
    const content = readPage('pages/foundry/market-signal-test.tsx')
    // The old page had inline analysis logic — check it's gone
    expect(content).not.toContain('analyzeMarketSignal')
    expect(content).not.toContain('clarityScore')
    expect(content).not.toContain('evidenceScore')
  })

  it('should not contain checkout or pricing', () => {
    const content = readPage('pages/foundry/market-signal-test.tsx')
    const paidPatterns = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession', 'Stripe']
    for (const pattern of paidPatterns) {
      expect(content).not.toContain(pattern)
    }
  })

  // ─── Test 3: release-risk-test uses kernel signal ──────────────────────────

  it('should import or call the kernel signal path', () => {
    const content = readPage('pages/foundry/release-risk-test.tsx')
    expect(content).toContain('useKernelSignal')
    expect(content).toContain('FreeSignalResult')
  })

  it('should not use the old local diagnostic engine', () => {
    const content = readPage('pages/foundry/release-risk-test.tsx')
    expect(content).not.toContain('analyzeReleaseRisk')
    expect(content).not.toContain('PROCEED')
    expect(content).not.toContain('HOLD')
    expect(content).not.toContain('ESCALATE')
  })

  it('should not contain checkout or pricing', () => {
    const content = readPage('pages/foundry/release-risk-test.tsx')
    const paidPatterns = ['stripePriceId', 'stripeProductId', 'checkoutUrl', '/api/checkout', 'createCheckoutSession', 'Stripe']
    for (const pattern of paidPatterns) {
      expect(content).not.toContain(pattern)
    }
  })

  // ─── Test 4: /kernel/signal is marked as internal/preview ──────────────────

  it('should be marked as internal preview', () => {
    const content = readPage('pages/kernel/signal.tsx')
    expect(content).toContain('Internal Preview')
    expect(content.toLowerCase()).toContain('not for public navigation')
  })

  // ─── Test 5: All Foundry pages render FreeSignalResult ─────────────────────

  it('should render FreeSignalResult for all Foundry pages', () => {
    const decisionContent = readPage('pages/foundry/decision-test.tsx')
    const marketContent = readPage('pages/foundry/market-signal-test.tsx')
    const releaseContent = readPage('pages/foundry/release-risk-test.tsx')

    expect(decisionContent).toContain('<FreeSignalResult')
    expect(marketContent).toContain('<FreeSignalResult')
    expect(releaseContent).toContain('<FreeSignalResult')
  })

  // ─── Test 6: No old diagnostic imports remain in Foundry pages ─────────────

  it('should not import old diagnostic modules', () => {
    const pages = [
      'pages/foundry/decision-test.tsx',
      'pages/foundry/market-signal-test.tsx',
      'pages/foundry/release-risk-test.tsx',
    ]

    const forbiddenImports = [
      'decision-failure-map',
      'constraint-reality-layer',
      'foundry/track',
    ]

    for (const page of pages) {
      const content = readPage(page)
      for (const forbidden of forbiddenImports) {
        expect(content).not.toContain(forbidden)
      }
    }
  })
})
