// scripts/generate-ultimate-purpose-of-man-pdf.tsx
import * as React from "react";
import fs from "node:fs";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// ---------------- Styles ----------------

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 30,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
});

// ---------------- Document Component ----------------

const MyDocument: React.FC = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>The Ultimate Purpose of Man</Text>
        <Text>Section #1</Text>
      </View>
      <View style={styles.section}>
        <Text>Section #2</Text>
      </View>
    </Page>
  </Document>
);

// ---------------- Main generator ----------------

async function generatePdf(): Promise<void> {
  console.log("[pdf] Starting PDF generation...");

  const outputDir = "./public/downloads";
  const outputPath = `${outputDir}/ultimate-purpose-of-man.pdf`;

  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Render the PDF to a buffer and save it
    const instance = pdf(<MyDocument />);

    // Typings for @react-pdf/renderer are looser; at runtime this is a Buffer.
    const buffer = (await instance.toBuffer()) as unknown as Buffer;

    fs.writeFileSync(outputPath, buffer);

    console.log("[pdf] PDF generated successfully at:", outputPath);
  } catch (error) {
    console.error("[pdf] Error generating PDF:", error);
    process.exit(1);
  }
}

// Run the generation
void generatePdf();