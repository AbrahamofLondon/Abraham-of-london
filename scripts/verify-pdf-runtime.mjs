import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

const outDir = join(process.cwd(), "tmp", "retained-pdf-runtime");
const oversightPath = join(outDir, "oversight-brief.pdf");
const proofPath = join(outDir, "proof-pack.pdf");
const manifestPath = join(outDir, "verification.json");

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    marginBottom: 12,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  section: {
    marginTop: 12,
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    marginBottom: 4,
    color: "#666666",
  },
});

function containsUnsafeTerms(buffer) {
  const text = buffer.toString("latin1").toLowerCase();
  return [
    "always-on governance",
    "automated oversight is active",
    "continuous monitoring",
    "fully automated retained oversight",
    "enterprise-ready £50k",
    "guaranteed governance",
  ].filter((term) => text.includes(term));
}

function OversightVerificationDocument({ generatedAt }) {
  return React.createElement(
    Document,
    { title: "Runtime Verification Oversight Brief", author: "Abraham of London" },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Retained Oversight Runtime Verification"),
      React.createElement(
        Text,
        { style: styles.body },
        "This artifact verifies PDF generation in the local runtime. It does not imply active retained coverage, automated oversight, verified outcomes, or general £50k readiness."
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Verification Scope"),
        React.createElement(Text, { style: styles.body }, "Sponsor-safe fallback brief rendered because local retained-history fixtures are limited.")
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Generated At"),
        React.createElement(Text, { style: styles.body }, generatedAt)
      ),
    ),
  );
}

function ProofPackVerificationDocument({ generatedAt }) {
  return React.createElement(
    Document,
    { title: "Runtime Verification Proof Pack", author: "Abraham of London" },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Proof Pack Runtime Verification"),
      React.createElement(
        Text,
        { style: styles.body },
        "This artifact verifies proof-pack PDF rendering in the local runtime. It is a technical runtime check, not a commercial or governance claim."
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Runtime Posture"),
        React.createElement(Text, { style: styles.body }, "Infrastructure verified. History depth remains dependent on live retained usage.")
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.label }, "Generated At"),
        React.createElement(Text, { style: styles.body }, generatedAt)
      ),
    ),
  );
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const oversightBuffer = Buffer.from(await renderToBuffer(React.createElement(OversightVerificationDocument, { generatedAt })));
  const proofBuffer = Buffer.from(await renderToBuffer(React.createElement(ProofPackVerificationDocument, { generatedAt })));

  writeFileSync(oversightPath, oversightBuffer);
  writeFileSync(proofPath, proofBuffer);

  const result = {
    verifiedAt: generatedAt,
    fixture: "runtime_verification_fallback",
    oversightBrief: {
      contentType: "application/pdf",
      bytes: oversightBuffer.byteLength,
      unsafeTerms: containsUnsafeTerms(oversightBuffer),
    },
    proofPack: {
      contentType: "application/pdf",
      bytes: proofBuffer.byteLength,
      unsafeTerms: containsUnsafeTerms(proofBuffer),
    },
  };

  if (result.oversightBrief.bytes < 1000) throw new Error("Oversight brief PDF buffer is too small.");
  if (result.proofPack.bytes < 1000) throw new Error("Proof pack PDF buffer is too small.");
  if (result.oversightBrief.unsafeTerms.length > 0) throw new Error("Oversight brief PDF contains unsafe terms.");
  if (result.proofPack.unsafeTerms.length > 0) throw new Error("Proof pack PDF contains unsafe terms.");

  writeFileSync(manifestPath, JSON.stringify(result, null, 2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

await main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
