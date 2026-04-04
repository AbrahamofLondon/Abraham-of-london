import type { NextApiRequest, NextApiResponse } from "next";
import { pdf } from "@react-pdf/renderer";
import ReportDoc from "@/lib/diagnostics/pdf/ReportDoc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body;

  const doc = pdf(<ReportDoc data={data} />);
  const buffer = await doc.toBuffer();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=diagnostic-report.pdf");

  res.send(buffer);
}