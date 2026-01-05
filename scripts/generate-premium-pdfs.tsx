/* scripts/generate-premium-pdfs.tsx - V3.7 (Dynamic Naming) */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

Font.register({
  family: 'EB Garamond',
  src: 'https://fonts.gstatic.com/s/ebgaramond/v26/Sl0V77v_Bp6itS5XooPGEExvXv9N.ttf'
});

const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: '#FFFFFF', fontFamily: 'EB Garamond' },
  header: { borderBottomWidth: 2, borderBottomColor: '#D4AF37', paddingBottom: 20, marginBottom: 30, textAlign: 'center' },
  title: { fontSize: 28, color: '#1A1A1A' },
  subtitle: { fontSize: 10, color: '#666666', textTransform: 'uppercase', letterSpacing: 2 },
  section: { marginVertical: 15, padding: 15, backgroundColor: '#FAFAFA', borderLeftWidth: 3, borderLeftColor: '#1A1A1A' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  placeholder: { height: 60, borderWidth: 1, borderColor: '#EEEEEE', backgroundColor: '#FFFFFF' },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, borderTopWidth: 0.5, borderTopColor: '#EEEEEE', paddingTop: 10, fontSize: 8, color: '#999999', textAlign: 'center' }
});

const CanvasDocument = ({ format, tier, quality }: any) => (
  <Document author="Abraham of London">
    <Page size={format} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Legacy Architecture Canvas</Text>
        <Text style={styles.subtitle}>{tier.toUpperCase()} STRATEGIC FRAMEWORK</Text>
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>SOVEREIGN THESIS</Text><View style={styles.placeholder} /></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>CAPITAL MATRIX</Text><View style={styles.placeholder} /></View>
      <View style={styles.footer}><Text>© {new Date().getFullYear()} Abraham of London • {tier.toUpperCase()} • {quality.toUpperCase()}</Text></View>
    </Page>
  </Document>
);

export class PremiumPDFGenerator {
  private config: any;
  constructor(config: any) { this.config = config; }

  async generate() {
    const startTime = Date.now();
    const { format, tier, quality, outputDir, interactive } = this.config;
    
    const initialBuffer = await renderToBuffer(<CanvasDocument format={format} tier={tier} quality={quality} />);
    const pdfDoc = await PDFDocument.load(initialBuffer);
    
    if (interactive) {
      const form = pdfDoc.getForm();
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      // Add field
      const field = form.createTextField('input_1');
      field.addToPage(page, { x: 65, y: height - 250, width: width - 130, height: 50 });
    }

    const finalBuffer = await pdfDoc.save();
    
    // STRATEGIC FIX: Dynamic filename including the TIER
    const fileName = `legacy-canvas-${tier}-${format.toLowerCase()}-${quality}.pdf`;
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, Buffer.from(finalBuffer));

    return { filePath, size: finalBuffer.length, duration: Date.now() - startTime };
  }
}