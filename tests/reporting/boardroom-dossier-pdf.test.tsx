import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { BoardroomDossierDocument } from "@/lib/boardroom/dossier-pdf";
import { buildBoardroomDossierFixture } from "./fixtures/boardroom-dossier-fixture";

describe("BoardroomDossierDocument", () => {
  it("renders cover, transmission, provenance, and all governed sections", async () => {
    const buffer = await renderToBuffer(
      <BoardroomDossierDocument
        dossier={buildBoardroomDossierFixture()}
        organisationName="Northstar Holdings"
        customerName="A. Client"
        orderId="order-123"
        referenceId="AoL-BB-ORDER123-20260612"
        artifactHash="sha256:abc123"
      />,
    );

    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("renders with long intake text and absent optional sections", async () => {
    const buffer = await renderToBuffer(
      <BoardroomDossierDocument
        dossier={buildBoardroomDossierFixture({
          topContradictions: [],
          riskExposure: [],
          breaches: [],
          verifiedOutcomes: [],
          recommendedBoardActions: [],
          dataCompleteness: { score: 40, missingFields: [] },
        })}
        organisationName=""
      />,
    );

    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("does not use a bare Helvetica template and includes REAS architecture terms", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib", "boardroom", "dossier-pdf.tsx"),
      "utf8",
    );

    expect(source).not.toContain('"Helvetica"');
    expect(source).not.toContain('"Helvetica-Bold"');
    expect(source).toContain("Transmission Note");
    expect(source).toContain("Executive Judgement");
    expect(source).toContain("Falsification Questions");
    expect(source).toContain("Artifact hash");
  });

  it("declares the full thirteen-section Boardroom reading order", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib", "boardroom", "dossier-pdf.tsx"),
      "utf8",
    );
    const sectionTitles = [
      "Executive Judgement",
      "Decision Pressure Diagnosis",
      "Intake Facts",
      "Our Assumptions",
      "Risk Exposure Map",
      "Objection Handling",
      "Decision Paths",
      "Next Admissible Move",
      "Evidence Gaps",
      "Falsification Questions",
      "Outcome Hypothesis",
      "Delivery Note",
      "Feedback Instruction",
    ];

    for (const title of sectionTitles) {
      expect(source).toContain(title);
    }
  });
});
