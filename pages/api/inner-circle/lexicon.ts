// pages/api/inner-circle/lexicon.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // 1. HARDENED AUTH CHECK
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Institutional Access Denied" });
  }

  const { slug, title, definition, category, content } = req.body;
  const filePath = path.join(process.cwd(), 'content/lexicon', `${slug}.mdx`);

  // 2. STABILIZED WRITE OPERATION
  if (req.method === 'POST' || req.method === 'PUT') {
    const mdxContent = `---
title: "${title}"
definition: "${definition}"
category: "${category}"
date: "${new Date().toISOString()}"
---

${content}`;

    try {
      // Create backup before write
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, `${filePath}.backup`);
      }
      
      fs.writeFileSync(filePath, mdxContent, 'utf8');
      return res.status(200).json({ success: true, message: `${title} stabilized.` });
    } catch (error) {
      return res.status(500).json({ error: "Filesystem write failure" });
    }
  }
}