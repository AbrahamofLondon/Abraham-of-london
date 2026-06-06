import type { NextApiRequest, NextApiResponse } from "next";

import { createGmiRedTeamSubmission } from "@/lib/intelligence/gmi-red-team-store";

function normaliseBody(req: NextApiRequest) {
  const sourceLinks =
    Array.isArray(req.body?.sourceLinks)
      ? req.body.sourceLinks
      : typeof req.body?.sourceLinks === "string" && req.body.sourceLinks.trim()
        ? [req.body.sourceLinks.trim()]
        : [];

  return {
    callId: req.body?.callId,
    counterThesis: req.body?.counterThesis,
    evidence: req.body?.evidence,
    sourceLinks,
    submitterName: req.body?.submitterName,
    submitterEmail: req.body?.submitterEmail,
    consentToPublishIfSelected:
      req.body?.consentToPublishIfSelected === true ||
      req.body?.consentToPublishIfSelected === "true" ||
      req.body?.consentToPublishIfSelected === "on",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await createGmiRedTeamSubmission(normaliseBody(req));
  if (!result.ok) {
    return res.status(400).json({
      accepted: false,
      issues: result.issues,
    });
  }

  return res.status(202).json({
    accepted: true,
    submissionId: result.id,
    status: "QUEUED_FOR_EDITORIAL_REVIEW",
    message: "Challenge received. Accepted challenges may be addressed in a future GMI edition or Red Team Register.",
  });
}
