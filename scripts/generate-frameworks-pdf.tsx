/* scripts/generate-frameworks-pdf.tsx */
import fsSync from "fs";
import path from "path";
import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { FRAMEWORKS, type Framework } from "../lib/resources/strategic-frameworks";

Font.register({ family: "Times-Roman", src: "Times-Roman" });
Font.register({ family: "Times-Italic", src: "Times-Italic" });
Font.register({ family: "Helvetica", src: "Helvetica" });
Font.register({ family: "Helvetica-Bold", src: "Helvetica-Bold" });
Font.register({ family: "Courier", src: "Courier" });

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
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: "#EEE", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#999" },
});

const FrameworkDossier = ({ f }: { f: Framework }) => (
  <Document 
    title={`${f.title} | Strategic Framework | Abraham of London`}
    author="Abraham of London"
    subject={f.oneLiner}
    producer="Abraham of London Strategic Engine"
    creator="Abraham of London"
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
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>© Abraham of London</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads");
  if (!fsSync.existsSync(outDir)) fsSync.mkdirSync(outDir, { recursive: true });

  for (const f of FRAMEWORKS) {
    try {
      const filePath = path.join(outDir, `${f.slug}.pdf`);
      const stream = await pdf(<FrameworkDossier f={f} />).toBuffer();
      const chunks: any[] = [];
      // @ts-ignore
      for await (const chunk of stream) { chunks.push(chunk as unknown as Uint8Array); }
      const finalData = Buffer.concat(chunks) as unknown as any;
      fsSync.writeFileSync(filePath, finalData);
      console.log(`   - Generated: ${f.slug}.pdf`);
    } catch (err) {
      console.error(`❌ Failed ${f.slug}:`, err);
    }
  }
}

main();
