/* scripts/generate-frameworks-pdf.tsx */
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Import your data
import { FRAMEWORKS, type Framework } from "../lib/resources/strategic-frameworks";

// 1. REGISTER STANDARD FONTS
Font.register({ family: "Times-Roman", src: "Times-Roman" });
Font.register({ family: "Times-Italic", src: "Times-Italic" });
Font.register({ family: "Helvetica", src: "Helvetica" });
Font.register({ family: "Helvetica-Bold", src: "Helvetica-Bold" });
Font.register({ family: "Courier", src: "Courier" });

// 2. STYLES
const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: "#FFFFFF", fontFamily: "Helvetica" },
  header: { marginBottom: 25, borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 15 },
  brand: { fontSize: 8, color: "#666", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 26, fontFamily: "Times-Roman", color: "#000", marginBottom: 8 },
  oneLiner: { fontSize: 11, color: "#444", fontFamily: "Times-Italic", lineHeight: 1.4 },
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 30, paddingBottom: 15, borderBottomWidth: 0.5, borderBottomColor: "#DDD" },
  metaItem: { fontSize: 8, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 12, marginTop: 20, textTransform: "uppercase", letterSpacing: 1, color: "#000" },
  logicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  logicCard: { width: "31%", padding: 10, backgroundColor: "#F5F5F5", borderRadius: 4, marginBottom: 10 },
  logicTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  logicBody: { fontSize: 9, lineHeight: 1.4, color: "#333" },
  stepRow: { flexDirection: "row", marginBottom: 10 },
  stepNum: { width: 20, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#888" },
  stepContent: { flex: 1 },
  stepDeliverable: { fontSize: 9, color: "#555", fontStyle: "italic", marginTop: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#EEE", paddingVertical: 4 },
  colMetric: { width: "35%", fontSize: 10, fontFamily: "Helvetica-Bold" },
  colReason: { width: "45%", fontSize: 10, color: "#333" },
  colCadence: { width: "20%", fontSize: 10, color: "#666", textAlign: "right" },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#EEE", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#999" },
});

// 3. DOCUMENT COMPONENT WITH METADATA
const FrameworkDossier = ({ f }: { f: Framework }) => (
  <Document 
    title={`${f.title} | Strategic Framework | Abraham of London`}
    author="Abraham of London"
    subject={f.oneLiner}
    keywords={`strategy, governance, ${f.tag}, leadership, institutional-design`}
    creator="Abraham of London Strategic Engine"
    producer="Abraham of London"
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.brand}>Abraham of London • Strategic Frameworks</Text>
        <Text style={styles.title}>{f.title}</Text>
        <Text style={styles.oneLiner}>{f.oneLiner}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>TIER: {f.tier.join(" / ")}</Text>
        <Text style={styles.metaItem}>TAG: {f.tag}</Text>
      </View>
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      {f.executiveSummary.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={{ width: 15, fontSize: 14, color: "#D4AF37" }}>•</Text>
          <Text style={{ flex: 1, fontSize: 10, lineHeight: 1.5 }}>{item}</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Operating Logic</Text>
      <View style={styles.logicGrid}>
        {f.operatingLogic.map((logic, i) => (
          <View key={i} style={styles.logicCard}>
            <Text style={styles.logicTitle}>{logic.title}</Text>
            <Text style={styles.logicBody}>{logic.body}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Application Playbook</Text>
      {f.applicationPlaybook.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepNum}>{i + 1}.</Text>
          <View style={styles.stepContent}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{step.step}</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.4, marginVertical: 2 }}>{step.detail}</Text>
            <Text style={styles.stepDeliverable}>→ Output: {step.deliverable}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      {f.metrics.map((m, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.colMetric}>{m.metric}</Text>
          <Text style={styles.colReason}>{m.whyItMatters}</Text>
          <Text style={styles.colCadence}>{m.reviewCadence}</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Board Questions</Text>
      {f.boardQuestions.map((q, i) => (
         <Text key={i} style={{ fontSize: 10, marginBottom: 4, fontFamily: "Times-Italic" }}>? {q}</Text>
      ))}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>© Abraham of London</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

// 4. MAIN EXECUTION
async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads", "frameworks");
  if (!fsSync.existsSync(outDir)) {
    await fs.mkdir(outDir, { recursive: true });
  }

  console.log(`📚 Generating ${FRAMEWORKS.length} Framework Dossiers...`);

  for (const f of FRAMEWORKS) {
    try {
      const fileName = `${f.slug}.pdf`;
      const filePath = path.join(outDir, fileName);
      
      const blob = await pdf(<FrameworkDossier f={f} />).toBuffer();
      
      const chunks: any[] = [];
      // @ts-ignore
      for await (const chunk of blob) {
        chunks.push(chunk as unknown as Uint8Array);
      }
      
      await fs.writeFile(filePath, Buffer.concat(chunks) as unknown as Uint8Array);
      
      console.log(`   - Writing: ${fileName}`);
    } catch (err) {
      console.error(`❌ Failed to generate ${f.slug}:`, err);
    }
  }
  console.log("✅ All Framework PDFs Generated.");
}

main();