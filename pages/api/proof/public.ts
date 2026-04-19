import type { NextApiRequest, NextApiResponse } from "next";
import { getPublicProofEvidence } from "@/lib/proof/evidence";

type ResponseBody =
  | Awaited<ReturnType<typeof getPublicProofEvidence>> & { ok: true }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const proof = await getPublicProofEvidence();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ ok: true, ...proof });
  } catch (error) {
    console.error("[proof.public]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
