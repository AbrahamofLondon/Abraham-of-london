// pages/api/frameworks/[slug]/protected.ts — STRATEGIC PAYLOAD
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";

type Data = {
  error?: string;
  reason?: string;
  slug?: string;
  operatingLogic?: any[];
  applicationPlaybook?: string[];
  boardQuestions?: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Manuscript slug required' });
  
  // Validate against Postgres Session
  const access = await getInnerCircleAccess(req);
  
  if (!access.hasAccess) {
    return res.status(403).json({ 
      error: 'Institutional access denied', 
      reason: access.reason || 'Active Inner Circle session required'
    });
  }

  // Institutional Content
  res.setHeader('Cache-Control', 'private, no-store, must-revalidate');
  
  return res.status(200).json({
    slug,
    operatingLogic: [
      {
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