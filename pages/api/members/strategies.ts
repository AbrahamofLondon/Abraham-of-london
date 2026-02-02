// pages/api/strategies/index.ts — INSTITUTIONAL STRATEGY ENGINE
import { NextApiRequest, NextApiResponse } from 'next';
import { createStrictApiHandler } from '@/lib/server/inner-circle-access';
import { safeSlice } from "@/lib/utils/safe";

// Centralized Strategy Repository
const STRATEGIES_DATA = [
  {
    id: 'strat-001',
    title: 'Market Dominance Strategy',
    description: 'Advanced market penetration techniques for established businesses',
    content: 'Detailed implementation guide with case studies and metrics...',
    accessLevel: 'inner-circle',
    lastUpdated: '2026-01-15',
    tags: ['growth', 'scaling', 'market-leadership']
  },
  {
    id: 'strat-003',
    title: 'Competitive Intelligence Framework',
    description: 'Systematic competitor analysis and response strategies',
    content: 'Complete competitive intelligence methodology...',
    accessLevel: 'inner-circle',
    lastUpdated: '2026-01-05',
    tags: ['competitive-analysis', 'intelligence', 'strategy']
  }
];

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Access is injected by createStrictApiHandler via Postgres check
  const access = (req as any).innerCircleAccess; 
  const { method } = req;
  const { id, page = '1', limit = '10', tag } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const strategy = STRATEGIES_DATA.find(s => s.id === id);
          if (!strategy) return res.status(404).json({ error: 'Strategy not found' });
          
          return res.status(200).json({
            success: true,
            data: strategy,
            audit: { timestamp: new Date().toISOString(), node: 'IC-LONDON-01' }
          });
        } else {
          const pageNum = parseInt(page as string, 10);
          const limitNum = parseInt(limit as string, 10);
          
          let filtered = tag 
            ? STRATEGIES_DATA.filter(s => s.tags.includes(tag as string)) 
            : STRATEGIES_DATA;
          
          const paginated = safeSlice(filtered, (pageNum - 1) * limitNum, pageNum * limitNum);
          
          return res.status(200).json({
            success: true,
            data: paginated,
            pagination: {
              total: filtered.length,
              page: pageNum,
              totalPages: Math.ceil(filtered.length / limitNum)
            }
          });
        }

      case 'POST':
        // Only "private" (Founder/Admin) tier can create
        if (access.tier !== 'private') return res.status(403).json({ error: 'Administrative clearance required' });
        
        const createdStrategy = {
          id: `strat-${Date.now()}`,
          ...req.body,
          createdAt: new Date().toISOString()
        };
        
        return res.status(201).json({ success: true, data: createdStrategy });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end();
    }
  } catch (error) {
    console.error('[STRATEGIES_API_FAILURE]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default createStrictApiHandler(handler);