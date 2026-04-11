import type { NextApiRequest, NextApiResponse } from "next";
import { buildExecutiveCommandCentreData } from "@/lib/constitution/command-centre";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const data = buildExecutiveCommandCentreData();

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[COMMAND_CENTRE_ERROR]", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to build executive command centre data.",
    });
  }
}