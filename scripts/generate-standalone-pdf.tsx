/* scripts/generate-standalone-pdf.tsx */
import fsSync from "fs";
import path from "path";
import React from "react";
import { pdf, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";

const loadImageBuffer = (relativePath: string) => {
  try {
    const fullPath = path.join(process.cwd(), "public", relativePath);
    if (fsSync.existsSync(fullPath)) return fsSync.readFileSync(fullPath);
  } catch (e) { return null; }
  return null;
};

const coverBuffer = loadImageBuffer("assets/images/purpose-cover.jpg") || 
                    loadImageBuffer("assets/images/writing-desk.webp");

Font.register({ family: "AoLSerif", src: "Times-Roman" });
Font.register({ family: "AoLSerif", fontStyle: "italic", src: "Times-Italic" });
Font.register({ family: "AoLSans", src: "Helvetica" });
Font.register({ family: "AoLMono", src: "Courier" });

const BRAND = { bg: "#050609", gold2: "#FBBF24", white: "#F9FAFB", ink: "#E5E7EB", muted: "#9CA3AF", border: "#1b2230" };

const styles = StyleSheet.create({
  document: { backgroundColor: BRAND.bg },
  page: { paddingTop: 52, paddingBottom: 62, paddingHorizontal: 56, backgroundColor: BRAND.bg },
  topRail: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 0.7, borderBottomColor: BRAND.border, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  railEyebrow: { fontFamily: "AoLSans", fontSize: 8, textTransform: "uppercase", letterSpacing: 2.2, color: BRAND.gold2 },
  railTitle: { fontFamily: "AoLSerif", fontSize: 11, color: BRAND.white },
  footer: { position: "absolute", bottom: 28, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.6, borderTopColor: BRAND.border, paddingTop: 8 },
  smallBrand: { fontFamily: "AoLSans", fontSize: 8, color: BRAND.muted, textTransform: "uppercase" },
  pageNumber: { fontFamily: "AoLSans", fontSize: 8, color: BRAND.muted },
  h1: { fontFamily: "AoLSerif", fontSize: 22, color: BRAND.white, marginBottom: 12 },
  bodyText: { fontFamily: "AoLSans", fontSize: 10.3, lineHeight: 1.62, color: BRAND.ink, marginBottom: 10 }
});

const UltimatePurposeOfManPdf = ({ coverImage }: { coverImage: any }) => (
  <Document 
    title="The Ultimate Purpose of Man | Abraham of London"
    author="Abraham of London"
    creator="Abraham of London Strategic Engine"
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.topRail} fixed>
        <Text style={styles.railEyebrow}>Strategic Editorial</Text>
        <Text style={styles.railTitle}>Purpose Foundations</Text>
      </View>
      <Text style={styles.h1}>THE ULTIMATE PURPOSE OF MAN</Text>
      <Text style={styles.bodyText}>Purpose is structure, not abstraction; order, not inspiration.</Text>
      <View style={styles.footer} fixed>
        <Text style={styles.smallBrand}>Abraham of London · Strategic Editorials</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

async function main() {
  try {
    const outDir = path.join(process.cwd(), "public", "downloads");
    if (!fsSync.existsSync(outDir)) fsSync.mkdirSync(outDir, { recursive: true });
    
    const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");
    console.log("📄 Generating Editorial PDF...");

    const stream = await pdf(<UltimatePurposeOfManPdf coverImage={coverBuffer} />).toBuffer();
    const chunks: any[] = [];
    // @ts-ignore
    for await (const chunk of stream) { chunks.push(chunk as unknown as Uint8Array); }

    const finalData = Buffer.concat(chunks) as unknown as any;
    fsSync.writeFileSync(outFile, finalData);
    console.log(`✅ Success: ${outFile}`);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();