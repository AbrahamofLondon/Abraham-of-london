import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  listGmiRedTeamSubmissions,
  updateGmiRedTeamSubmissionReview,
} from "@/lib/intelligence/gmi-red-team-store";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "acknowledged", "rejected", "incorporated", "disconfirmed_call", "closed"]),
  adminNotes: z.string().max(3000).optional(),
  publicResponse: z.string().max(3000).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminServer(req, res, {
    routeKey: "admin-intelligence-gmi-red-team",
  });
  if (!session) return;

  if (req.method === "GET") {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const submissions = await listGmiRedTeamSubmissions(status);
    return res.status(200).json({ submissions, total: submissions.length });
  }

  if (req.method === "POST") {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const result = await updateGmiRedTeamSubmissionReview({
      ...parsed.data,
      reviewedBy: session.user?.email ?? "ADMIN",
    });
    return res.status(result.ok ? 200 : 422).json(result);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}

