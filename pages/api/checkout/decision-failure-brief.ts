/**
 * pages/api/checkout/decision-failure-brief.ts — RETIRED
 *
 * This API has been superseded by the Living Case checkout architecture.
 * Use POST /api/checkout/living-case instead.
 *
 * Returns 410 Gone to indicate the resource is permanently unavailable.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    error: 'GONE',
    message: 'This checkout endpoint has been retired. Use POST /api/checkout/living-case for the canonical checkout flow.',
    canonicalRoute: '/api/checkout/living-case',
  })
}