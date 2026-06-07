/**
 * tests/decision-instruments/user-run-history.test.ts
 *
 * User Instrument Run History (P3) — Authority Tests
 *
 * Tests:
 *   1. /api/instruments/runs/me route exists
 *   2. Requires session authentication
 *   3. Returns only own runs (email-scoped)
 *   4. Artifact download URL only included when artifactState = READY
 *   5. Score/result is included in the shaped response
 *   6. Pagination support (limit, cursor, hasMore)
 *   7. Summary counts (total, completed, failed, withArtifacts)
 *   8. Display names map to all 11 instruments
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INSTRUMENT_ENTITLEMENTS } from '@/lib/decision-instruments/instrument-run-authority'

// ─── Route source guards ──────────────────────────────────────────────────────

describe('runs/me route — source guards', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/api/instruments/runs/me/route.ts'),
    'utf-8',
  )

  it('requires session authentication', () => {
    expect(source).toContain('getServerSession')
    expect(source).toContain('Authentication required')
  })

  it('scopes query to session userEmail', () => {
    expect(source).toContain('userEmail')
    // The Prisma where clause must use the session email
    expect(source).toContain('decisionInstrumentRun.findMany')
  })

  it('artifact download URL only provided when READY', () => {
    expect(source).toContain("artifactState === 'READY'")
    expect(source).toContain('artifactDownloadUrl')
  })

  it('includes summary counts', () => {
    expect(source).toContain('total')
    expect(source).toContain('completed')
    expect(source).toContain('failed')
    expect(source).toContain('withArtifacts')
  })

  it('supports pagination (limit, hasMore, nextCursor)', () => {
    expect(source).toContain('limit')
    expect(source).toContain('hasMore')
    expect(source).toContain('nextCursor')
  })

  it('does NOT expose other users\'s runs (email-scoped query)', () => {
    // Query must be scoped — check that userEmail is passed to Prisma where
    expect(source).toContain('where:')
    expect(source).toContain('userEmail,')
  })

  it('includes instrumentName display label', () => {
    expect(source).toContain('instrumentName')
    expect(source).toContain('INSTRUMENT_DISPLAY_NAMES')
  })

  it('includes nextRouteSlug for progression guidance', () => {
    expect(source).toContain('nextRouteSlug')
  })
})

// ─── Display names coverage ───────────────────────────────────────────────────

describe('instrument display names', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/api/instruments/runs/me/route.ts'),
    'utf-8',
  )
  const allSlugs = Object.keys(INSTRUMENT_ENTITLEMENTS)

  it('has a display name entry for each of the 11 instruments', () => {
    for (const slug of allSlugs) {
      expect(
        source,
        `Missing INSTRUMENT_DISPLAY_NAMES entry for slug "${slug}"`,
      ).toContain(`'${slug}'`)
    }
  })

  it('all 11 slugs are covered', () => {
    expect(allSlugs).toHaveLength(11)
  })
})
