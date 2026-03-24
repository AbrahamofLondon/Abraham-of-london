import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PDFRegistryEntry as PDFConfig } from "../pdf/registry";
import type { WatermarkPayload } from "../intelligence/watermark-delegate";

import BriefCoverPage from "../../../components/print/BriefCoverPage";
import ForensicMarkLayer from "../../../components/print/ForensicMarkLayer";
import BriefHeaderBar from "../../../components/print/BriefHeaderBar";
import BriefFooterBar from "../../../components/print/BriefFooterBar";
import ExecutiveSummaryPanel from "../../../components/print/ExecutiveSummaryPanel";
import KeyJudgementsPanel from "../../../components/print/KeyJudgementsPanel";

import * as briefRenderer from "../renderers/renderBriefBody";

/* -------------------------------------------------------------------------- */
/* Design Tokens                                                              */
/* -------------------------------------------------------------------------- */
const PAPER = "#FCFBF7";
const INK = "#121416";
const BRASS = "#8A6A2F";
const BRASS_SOFT = "#B49861";
const SOFT = "#59616E";
const SOFTER = "#727B89";
const MIST = "#E8E1D4";
const PANEL = "#F7F3EC";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    color: INK,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 54,
    fontFamily: "Helvetica",
    fontSize: 10.4,
    lineHeight: 1.58,
  },
  pageFrameTop: { position: "absolute", top: 22, left: 54, right: 54, height: 1, backgroundColor: MIST },
  pageFrameBottom: { position: "absolute", bottom: 48, left: 54, right: 54, height: 1, backgroundColor: MIST },
  frontMatterWrap: { marginTop: 14 },
  introText: { fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.58, color: SOFT },
  
  // 4D Framework Headings
  h2: { fontFamily: "Helvetica-Bold", fontSize: 13, color: BRASS, marginTop: 18, marginBottom: 6 },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: INK, marginTop: 12, marginBottom: 4 },
  
  // AOL Audit Table Styles (Mapped from Image 5cbeac.png)
  tableContainer: { marginTop: 14, marginBottom: 14 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  tableHeaderRow: { borderBottomWidth: 1.5, borderBottomColor: BRASS_SOFT },
  tableCell: { paddingVertical: 8, paddingHorizontal: 4, flex: 1 },
  tableCellHeader: { fontFamily: "Helvetica-Bold", fontSize: 8, color: BRASS, textTransform: "uppercase", letterSpacing: 1 },
  tableCellText: { fontSize: 9, color: INK },
  tableCellMonospace: { fontFamily: "Courier", fontSize: 8.5, color: BRASS }, // For the "Day" column

  listItem: { flexDirection: "row", marginBottom: 6, paddingLeft: 4 },
  listBullet: { width: 12, color: BRASS_SOFT, fontFamily: "Helvetica-Bold" },
  listContent: { flex: 1 },
  
  attestationBlock: { marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: MIST },
  attestationKicker: { fontFamily: "Helvetica-Bold", fontSize: 8.1, letterSpacing: 1.8, textTransform: "uppercase", color: BRASS, marginBottom: 8 },
  attestationText: { fontFamily: "Helvetica", fontSize: 8.9, lineHeight: 1.58, color: SOFT, marginBottom: 5 },
});

/* -------------------------------------------------------------------------- */
/* Helper Functions                                                           */
/* -------------------------------------------------------------------------- */

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  return value ? String(value) : "";
}

function deriveClassification(config: PDFConfig, watermark: WatermarkPayload): string {
  const metadata = watermark?.metadata as any;
  return (safeString(metadata?.aol?.classification) || safeString((config as any).classification) || "PUBLIC").toUpperCase();
}

function deriveReference(config: PDFConfig): string {
  return safeString((config as any).institutionalId) || safeString(config.id) || "UNFILED";
}

function deriveTransmissionToken(watermark: WatermarkPayload, config: PDFConfig): string {
  const metadata = watermark?.metadata as any;
  return safeString(metadata?.aol?.traceId) || safeString(watermark.overlayToken) || "UNTRACKED";
}

/* -------------------------------------------------------------------------- */
/* Body Renderer                                                              */
/* -------------------------------------------------------------------------- */

function fallbackRenderBriefBody(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let currentTable: string[][] = [];

  const flushTable = () => {
    if (currentTable.length > 0) {
      nodes.push(
        <View key={`table-${nodes.length}`} style={styles.tableContainer}>
          {currentTable.map((row, ri) => (
            <View key={`row-${ri}`} style={[styles.tableRow, ri === 0 && styles.tableHeaderRow]}>
              {row.map((cell, ci) => (
                <View key={`cell-${ci}`} style={styles.tableCell}>
                  <Text style={ri === 0 ? styles.tableCellHeader : (ci === 0 ? styles.tableCellMonospace : styles.tableCellText)}>
                    {cell.trim()}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
      currentTable = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table Logic
    if (line.startsWith("|")) {
      const cells = line.split("|").filter(c => c.trim() !== "" && !c.includes("---"));
      if (cells.length > 0) { currentTable.push(cells); continue; }
    } else { flushTable(); }

    // Heading Logic
    if (line.startsWith("## ")) {
      nodes.push(<Text key={i} style={styles.h2}>{line.replace("## ", "")}</Text>);
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(<Text key={i} style={styles.h3}>{line.replace("### ", "")}</Text>);
      continue;
    }

    // List Logic
    if (line.startsWith("* ") || line.startsWith("- ")) {
      nodes.push(
        <View key={i} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={styles.listContent}>
            <Text style={styles.introText}>{line.substring(2)}</Text>
          </View>
        </View>
      );
      continue;
    }

    // Paragraph Logic
    if (line && !line.startsWith("#")) {
      nodes.push(<Text key={i} style={[styles.introText, { marginBottom: 8 }]}>{line}</Text>);
    }
  }
  flushTable();
  return nodes;
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export const InstitutionalBriefDocument: React.FC<any> = ({ config, content, watermark, qrCode }) => {
  const classification = deriveClassification(config, watermark);
  const reference = deriveReference(config);
  const transmission = deriveTransmissionToken(watermark, config);
  const bodyNodes = fallbackRenderBriefBody(content);

  return (
    <Document title={config.title} author="Abraham of London" language="en-GB">
      <BriefCoverPage config={config} watermark={watermark} qrCode={qrCode} classification={classification} reference={reference} />
      
      <Page size="A4" style={styles.page}>
        <ForensicMarkLayer watermark={watermark} mode="interior" />
        <View style={styles.pageFrameTop} fixed />
        <View style={styles.pageFrameBottom} fixed />
        
        <BriefHeaderBar title={config.title} reference={reference} classification={classification} />

        <View style={styles.frontMatterWrap}>
          <View style={{ marginBottom: 20 }}>
            {bodyNodes}
          </View>

          <View style={styles.attestationBlock} wrap={false}>
            <Text style={styles.attestationKicker}>Attestation</Text>
            <Text style={styles.attestationText}>Issued under the authority of {config.signAs || "The Architect"}.</Text>
            <Text style={styles.attestationText}>Trace: {transmission}</Text>
          </View>
        </View>

        <BriefFooterBar watermark={watermark} reference={reference} signAs={config.signAs || "The Architect"} />
      </Page>
    </Document>
  );
};

export default InstitutionalBriefDocument;