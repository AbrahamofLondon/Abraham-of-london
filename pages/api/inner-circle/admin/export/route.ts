// app/api/inner-circle/admin/export/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withInnerCircleRateLimit, getPrivacySafeKeyExportWithRateLimit } from '@/lib/inner-circle';

export default withInnerCircleRateLimit({ adminOperation: true, adminId: 'admin-123' })(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { page = 1, limit = 50 } = req.query;
    
    const { data, headers } = await getPrivacySafeKeyExportWithRateLimit(
      { page: Number(page), limit: Number(limit) },
      'admin-123',
      req
    );
    
    // Add headers to response
    Object.entries(headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.status(200).json(data);
  }
);