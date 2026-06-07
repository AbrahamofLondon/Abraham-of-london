import type { NextApiRequest, NextApiResponse } from "next";
import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import {
  buildDbDerivedGmiBoardPack,
} from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import {
  getGmiBoardPulseData,
  getGmiFalsificationRules,
  getGmiPerformanceMetrics,
  getGmiProvenanceState,
  getGmiSourceAppendix,
} from "@/lib/intelligence/gmi-data-service.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const edition = typeof req.query.edition === "string" && req.query.edition.trim()
    ? req.query.edition.trim()
    : "GMI-Q2-2026";
  const format = typeof req.query.format === "string" ? req.query.format.toLowerCase() : "json";

  const [pack, sources, falsification, boardPulse, performance, provenance] = await Promise.all([
    buildDbDerivedGmiBoardPack(edition),
    getGmiSourceAppendix(edition),
    getGmiFalsificationRules(edition),
    getGmiBoardPulseData(edition),
    getGmiPerformanceMetrics(edition),
    getGmiProvenanceState(edition),
  ]);

  if (!provenance.data.isDataDerived) {
    return res.status(503).json({
      error: "GMI_DATA_NOT_DERIVED",
      provenance: provenance.data,
      warnings: provenance.provenance.warnings,
    });
  }

  const operatorConsequenceIndex = boardPulse.data?.operatorConsequenceIndex ?? [];
  const decisionsToMakeIn30Days = boardPulse.data?.decisionsToMakeIn30Days ?? [];
  const decisionsToPrepareIn90Days = boardPulse.data?.decisionsToPrepareIn90Days ?? [];
  const decisionsToDefer = boardPulse.data?.decisionsToDefer ?? [];
  const watchSignals = sources.data.slice(0, 3).map((source) => ({
    signal: source.claim,
    currentStatus: source.status,
    triggerThreshold: source.methodNote ?? source.observationWindow,
    evidencePosture: source.confidence,
    actionIfTriggered: source.adminJustification ?? "Review in Board Pulse.",
  }));
  const boardDecisions = decisionsToMakeIn30Days.map((decision: any) => ({
    decision: String(decision.decision ?? decision),
    timingCondition: String(decision.whyNow ?? "30-day decision window"),
    riskIfDelayed: String(decision.riskIfDelayed ?? "Decision delay compounds exposure."),
    ownerFunction: String(decision.suggestedOwner ?? "Board / Executive"),
    route: String(decision.route ?? "prepare"),
  }));
  if (format === "board-pulse-pdf") {
    const [{ renderToBuffer }, { GmiBoardPulsePDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/intelligence/gmi-board-pack-pdf"),
    ]);
    const pulse = {
      editionId: edition,
      currentThesis: sources.data[0]?.claim ?? `${edition} Board Pulse`,
      operatorConsequenceIndex,
      watchSignals,
      boardDecisions: decisionsToMakeIn30Days,
      decisionsToPrepareIn90Days,
      decisionsToDefer,
      topFalsificationRisk: falsification.data[0] ?? null,
      whatWouldChangeTheView: falsification.data[0]?.falsificationCondition ?? "No falsification rule registered.",
      performanceSnapshot: {
        totalCallsIssued: performance.data.totalCallsIssued,
        reviewedCallPercentage: performance.data.reviewedCallPercentage,
        confirmedCount: performance.data.confirmedCount,
        pendingCarryForwardCount: performance.data.pendingCarryForwardCount,
        weakDisconfirmedCount: performance.data.weakDisconfirmedCount,
      },
      lastUpdatedTimestamp: performance.data.lastLedgerUpdateTimestamp ?? new Date().toISOString(),
      ctas: [],
    };
    const pdfElement = React.createElement(GmiBoardPulsePDF, { pulse: pulse as any }) as unknown as React.ReactElement<DocumentProps>;
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
    const pdfElement = React.createElement(GmiBoardPackPDF, { pack: pack as any }) as unknown as React.ReactElement<DocumentProps>;
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
