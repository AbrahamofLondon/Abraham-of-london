// pages/api/pdf-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAllPDFs } from '@/scripts'; // Server-side import is OK

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pdfs = getAllPDFs();
    res.status(200).json({ pdfs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PDF data' });
  }
}
