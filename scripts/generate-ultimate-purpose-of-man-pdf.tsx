// scripts/generate-ultimate-purpose-of-man-pdf.tsx
import React from 'react';
import fs from 'node:fs';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#E4E4E4',
    padding: 30,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
});

// Create Document Component
const MyDocument = () => (
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

// Main function to generate PDF
async function generatePdf() {
  console.log('[pdf] Starting PDF generation...');

  const outputPath = './public/downloads/ultimate-purpose-of-man.pdf';

  try {
    // Ensure the output directory exists
    const dir = './public/downloads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Render the PDF to a buffer and save it
    const buffer = await pdf(<MyDocument />).toBuffer();
    fs.writeFileSync(outputPath, buffer);

    console.log('[pdf] PDF generated successfully at:', outputPath);
  } catch (error) {
    console.error('[pdf] Error generating PDF:', error);
    process.exit(1);
  }
}

// Run the generation
generatePdf();