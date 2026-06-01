/**
 * scripts/smoke-retainer-review-queue.ts
 *
 * Durable smoke test for RetainerReviewQueueEntry Prisma persistence.
 *
 * Usage:
 *   npx tsx scripts/smoke-retainer-review-queue.ts
 *
 * Requires:
 *   - Valid DATABASE_URL in .env or environment
 *   - Prisma client generated with RetainerReviewQueueEntry model
 *   - Database migrated with RetainerReviewQueueEntry table
 *
 * This script:
 *   1. Creates a test queue entry
 *   2. Reads it back by ID
 *   3. Updates it via approve
 *   4. Cleans up the test row
 *   5. Reports success or failure
 *
 * Do NOT run this in CI without a test database.
 */

// Load .env before anything else
import 'dotenv/config'

async function main() {
  console.log('[SMOKE] Retainer Review Queue — Durable Persistence Test')
  console.log('[SMOKE] ================================================')

  // Step 0: Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('[SMOKE] FAIL: DATABASE_URL not set. Cannot test durable persistence.')
    process.exit(1)
  }
  console.log('[SMOKE] DATABASE_URL is set.')

  // Step 1: Import Prisma
  let prisma: any
  try {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient()
    await prisma.$connect()
    console.log('[SMOKE] PASS: Prisma client connected.')
  } catch (err) {
    console.error('[SMOKE] FAIL: Cannot connect to database.', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const testCaseId = `smoke-test-${Date.now()}`

  try {
    // Step 2: Create
    console.log(`[SMOKE] Creating entry for caseId: ${testCaseId}`)
    const created = await prisma.retainerReviewQueueEntry.create({
      data: {
        caseId: testCaseId,
        readinessStatus: 'REVIEW_READY',
        reasons: ['Smoke test'],
        availableSignals: ['signal_continuity'],
        missingRequirements: ['outcome_memory'],
        status: 'PENDING_REVIEW',
      },
    })
    console.log(`[SMOKE] PASS: Created entry ${created.id}`)

    // Step 3: Read back
    const read = await prisma.retainerReviewQueueEntry.findUnique({
      where: { id: created.id },
    })
    if (!read) {
      console.error('[SMOKE] FAIL: Entry not found after create.')
      process.exit(1)
    }
    if (read.caseId !== testCaseId) {
      console.error(`[SMOKE] FAIL: caseId mismatch. Expected ${testCaseId}, got ${read.caseId}`)
      process.exit(1)
    }
    console.log('[SMOKE] PASS: Read back entry matches.')

    // Step 4: Update (approve)
    const updated = await prisma.retainerReviewQueueEntry.update({
      where: { id: created.id },
      data: {
        status: 'APPROVED_FOR_CONTACT',
        reviewedAt: new Date(),
        reviewedBy: 'smoke-test',
        reviewNote: 'Automated smoke test approval',
      },
    })
    if (updated.status !== 'APPROVED_FOR_CONTACT') {
      console.error(`[SMOKE] FAIL: Status not updated. Got ${updated.status}`)
      process.exit(1)
    }
    console.log('[SMOKE] PASS: Updated entry to APPROVED_FOR_CONTACT.')

    // Step 5: Dedupe check
    const dedupe = await prisma.retainerReviewQueueEntry.findFirst({
      where: {
        caseId: testCaseId,
        readinessStatus: 'REVIEW_READY',
        status: 'PENDING_REVIEW',
      },
    })
    if (dedupe) {
      console.error('[SMOKE] FAIL: Dedupe check found stale PENDING_REVIEW entry.')
      process.exit(1)
    }
    console.log('[SMOKE] PASS: No stale PENDING_REVIEW after approval.')

    // Step 6: Cleanup
    await prisma.retainerReviewQueueEntry.delete({ where: { id: created.id } })
    console.log('[SMOKE] PASS: Cleaned up test entry.')

    console.log('')
    console.log('[SMOKE] ================================================')
    console.log('[SMOKE] ALL CHECKS PASSED — Durable persistence verified.')
    console.log('[SMOKE] RetainerReviewQueueEntry can be promoted to ACTIVE')
    console.log('[SMOKE] once this script passes in CI/production environment.')

  } catch (err) {
    console.error('[SMOKE] FAIL:', err instanceof Error ? err.message : err)

    // Cleanup attempt
    try {
      await prisma.retainerReviewQueueEntry.deleteMany({ where: { caseId: testCaseId } })
    } catch { /* ignore cleanup errors */ }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
