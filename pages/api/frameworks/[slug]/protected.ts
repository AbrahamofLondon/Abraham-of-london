// pages/api/frameworks/[slug]/protected.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInnerCircleAccess } from '@/lib/inner-circle'; // Use your working version

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  
  // Use your working getInnerCircleAccess function
  const access = await getInnerCircleAccess(req);
  
  if (!access.hasAccess) {
    return res.status(403).json({ 
      error: 'Access denied', 
      reason: access.reason 
    });
  }

  // Return mock protected content for now
  const protectedContent = {
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

  res.status(200).json(protectedContent);
}