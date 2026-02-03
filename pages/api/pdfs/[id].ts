import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getPDFRegistry } from '@/lib/pdf/registry';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, download } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid Asset ID' });
  }

  try {
    const registry = getPDFRegistry();
    const asset = registry[id];

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in institutional registry' });
    }

    // 1. If just requesting metadata (for the Vault UI)
    if (download !== 'true') {
      return res.status(200).json({ success: true, asset });
    }

    // 2. If requesting the actual file download
    // TODO: Add your Auth/Session check here: 
    // const session = await getSession({ req });
    // if (asset.tier !== 'free' && !session) return res.status(403)...

    const filePath = path.join(process.cwd(), 'public', asset.publicHref || '');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical asset missing from storage' });
    }

    // Stream the file for institutional security
    const fileStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.pdf"`);
    
    return fileStream.pipe(res);

  } catch (error) {
    console.error('🏛️ [SYSTEM_ERROR]:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Institutional Registry Access Failure' 
    });
  }
}