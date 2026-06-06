import type { NextApiRequest, NextApiResponse } from "next";
import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { buildGmiBoardPulse } from "@/lib/intelligence/gmi-control-plane";
import { buildGmiBoardPackSnapshot } from "@/lib/intelligence/gmi-instrument";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const edition = typeof req.query.edition === "string" && req.query.edition.trim()
    ? req.query.edition.trim()
    : "GMI-Q2-2026";
  const format = typeof req.query.format === "string" ? req.query.format.toLowerCase() : "json";

  const pack = buildGmiBoardPackSnapshot(edition);

  if (format === "board-pulse-pdf") {
    const [{ renderToBuffer }, { GmiBoardPulsePDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/intelligence/gmi-board-pack-pdf"),
    ]);
    const pulse = buildGmiBoardPulse(edition);
    const pdfElement = React.createElement(GmiBoardPulsePDF, { pulse }) as unknown as React.ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(pdfElement);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${edition.toLowerCase()}-board-pulse.pdf"`,
    );
    return res.status(200).send(pdfBuffer);
  }

  if (format === "pdf") {
    const [{ renderToBuffer }, { GmiBoardPackPDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/intelligence/gmi-board-pack-pdf"),
    ]);
    const pdfElement = React.createElement(GmiBoardPackPDF, { pack }) as unknown as React.ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(pdfElement);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${edition.toLowerCase()}-board-pack.pdf"`,
    );
    return res.status(200).send(pdfBuffer);
  }

  return res.status(200).json(pack);
}
