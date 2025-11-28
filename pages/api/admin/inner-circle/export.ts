// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

type ExportRow = {
  email: string;
  firstName?: string;
  lastName?: string;
  innerCircleMember?: string;
  innerCircleJoinedAt?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method not allowed");
  }

  const adminToken = process.env.INNER_CIRCLE_ADMIN_TOKEN;
  const provided = req.headers.authorization?.replace("Bearer ", "");

  if (!adminToken || !provided || provided !== adminToken) {
    // Hard fail – never leak membership data without a valid secret
    return res.status(401).end("Unauthorized");
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).end("Resend not configured");
  }

  const resend = new Resend(resendApiKey);

  // Pseudocode: you'll need to adapt based on Resend's contacts list pagination.
  // This is a *pattern*, not a drop-in production exporter.
  const results: ExportRow[] = [];

  // TODO: implement pagination properly once you decide the volume.
  // For now we keep this as a stub so you don't accidentally start streaming data.
  // results.push(...fetchedContacts.map(...));

  return res.status(200).json({
    ok: true,
    count: results.length,
    data: results,
  });
}