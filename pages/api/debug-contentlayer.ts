// pages/api/debug-contentlayer.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Try to require contentlayer2 to see its structure
    const contentlayer2 = require('contentlayer2');
    
    // Also try to see if there's a generated directory
    const fs = require('fs');
    const path = require('path');
    
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'contentlayer2');
    const contentlayerFiles = fs.readdirSync(nodeModulesPath).filter(f => 
      f.includes('generated') || f.includes('index')
    );
    
    const exportsInfo = {
      packageJson: JSON.parse(
        fs.readFileSync(path.join(nodeModulesPath, 'package.json'), 'utf8')
      ).exports || 'No exports field',
      contentlayer2Keys: Object.keys(contentlayer2),
      filesInModule: contentlayerFiles,
      hasGeneratedDir: fs.existsSync(path.join(nodeModulesPath, 'generated')),
      generatedDirContents: fs.existsSync(path.join(nodeModulesPath, 'generated')) 
        ? fs.readdirSync(path.join(nodeModulesPath, 'generated'))
        : 'No generated directory'
    };

    res.status(200).json(exportsInfo);
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      code: error.code 
    });
  }
}