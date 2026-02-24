// pages/api/frameworks/[slug]/protected.ts — INSTITUTIONAL PAYLOAD
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const access = await getInnerCircleAccess(req);
  
  if (!access.hasAccess) {
    return res.status(403).json({ 
      error: 'Institutional access denied', 
      reason: 'Active Inner Circle session required' 
    });
  }

  // Set No-Cache for proprietary intelligence
  res.setHeader('Cache-Control', 'private, no-store, must-revalidate');
  
  return res.status(200).json({
    slug,
    operatingLogic: [
      {
        id: "core-2026",
        title: "Institutional Logic Core",
        body: "Proprietary implementation framework for large-scale organizational alignment."
      }
    ],
    applicationPlaybook: [
      "I. Institutional Alignment",
      "II. Resource Allocation Architecture",
      "III. Governance Configuration",
      "IV. Velocity Tracking"
    ],
    boardQuestions: [
      "Are current constraints non-negotiable?",
      "How is progress measured institutionally?",
      "What is the primary failure vector?",
      "Does this reinforce the 2026 vision?"
    ]
  });
}