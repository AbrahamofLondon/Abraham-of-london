/* pages/api/frameworks/[slug]/protected.ts - PRODUCTION VERSION - FULLY CORRECTED */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";

type Data = {
  error?: string;
  reason?: string;
  operatingLogic?: any[];
  applicationPlaybook?: string[];
  boardQuestions?: string[];
};

/**
 * PROTECTED FRAMEWORK HANDLER
 * Serves institutional-grade content only to validated Inner Circle sessions.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // 1. Method Enforcement
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Manuscript slug required' });
  }
  
  // 2. Access Validation via Postgres-backed logic
  // This uses the polymorphic wrapper to handle the NextApiRequest object
  const access = await getInnerCircleAccess(req);
  
  if (!access.hasAccess) {
    return res.status(403).json({ 
      error: 'Institutional access denied', 
      reason: access.reason || 'Active Inner Circle session required'
    });
  }

  // 3. Payload Delivery: Strategic Framework Data
  const protectedContent = {
    slug: Array.isArray(slug) ? slug[0] : slug, // Include slug in response for reference
    operatingLogic: [
      {
        title: "Inner Circle Exclusive Logic",
        body: "This content is only available to Inner Circle members. The full strategic framework includes proprietary insights, detailed implementation guides, and institutional-grade templates."
      }
    ],
    applicationPlaybook: [
      "Step 1: Institutional alignment",
      "Step 2: Resource allocation",
      "Step 3: Governance setup",
      "Step 4: Performance tracking"
    ],
    boardQuestions: [
      "What are the non-negotiable constraints?",
      "How do we measure institutional progress?",
      "What are the failure scenarios?",
      "How does this align with long-term vision?"
    ]
  };

  // 4. Cache Control: Ensure no intermediate caching of protected content
  res.setHeader('Cache-Control', 'private, no-store, must-revalidate');
  
  return res.status(200).json(protectedContent);
}