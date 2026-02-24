// lib/pdf-templates/BriefDocument.tsx - PREMIUM PRODUCTION VERSION
// Institutional-grade PDF template for intelligence briefs

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { PDFConfig } from '../pdf/registry';
import { formatMDXForPDF } from '../pdf/formatter';

// ============================================================================
// SAFETY: Font registration with fallbacks (prevents rendering failures)
// ============================================================================
try {
  // Register institutional fonts - with error catching to prevent crashes
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'https://fonts.cdnfonts.com/s/29145/Helvetica.woff', fontWeight: 400 },
      { src: 'https://fonts.cdnfonts.com/s/29145/Helvetica-Bold.woff', fontWeight: 700 },
      { src: 'https://fonts.cdnfonts.com/s/29145/Helvetica-Oblique.woff', fontWeight: 400, fontStyle: 'italic' },
    ]
  });
} catch {
  // Silently fail - built-in fonts will be used if remote fetch fails
}

// ============================================================================
// INSTITUTIONAL COLOUR PALETTE
// ============================================================================
const COLORS = {
  primary: '#000000',
  secondary: '#1A1A1A',
  accent: '#B8860B', // Dark Gold
  accentLight: '#DAA520',
  muted: '#666666',
  mutedLight: '#999999',
  border: '#E5E5E5',
  bg: '#FFFFFF',
  bgSecondary: '#F9F9F9',
  success: '#2E7D32',
  warning: '#B76E1E',
  error: '#B33A3A',
} as const;

// ============================================================================
// STYLESHEET - Premium typography and spacing
// ============================================================================
const styles = StyleSheet.create({
  page: {
    padding: '40 50',
    backgroundColor: COLORS.bg,
    fontFamily: 'Helvetica',
    color: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: `1.5pt solid ${COLORS.primary}`,
    paddingBottom: 12,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  documentId: {
    fontSize: 9,
    color: COLORS.muted,
    fontFamily: 'Helvetica-Oblique',
  },
  tierBar: {
    backgroundColor: COLORS.secondary,
    color: '#FFF',
    padding: '4 10',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    alignSelf: 'flex-start',
    borderRadius: 2,
  },
  tierBarInnerCircle: {
    backgroundColor: COLORS.accent,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    fontWeight: 'bold',
    lineHeight: 1.2,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 24,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginTop: 20,
    marginBottom: 8,
    borderBottom: `0.5pt solid ${COLORS.border}`,
    paddingBottom: 4,
  },
  contentBody: {
    fontSize: 11,
    lineHeight: 1.7,
    textAlign: 'justify',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    marginBottom: 8,
    textAlign: 'justify',
  },
  heading1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.primary,
  },
  heading2: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
    color: COLORS.primary,
  },
  heading3: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: COLORS.primary,
  },
  bulletList: {
    marginLeft: 12,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletPoint: {
    width: 8,
    fontSize: 11,
    marginRight: 4,
    color: COLORS.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.7,
  },
  metaGrid: {
    marginTop: 30,
    padding: 15,
    backgroundColor: COLORS.bgSecondary,
    borderLeft: `3pt solid ${COLORS.accent}`,
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 80,
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 8,
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: `0.5pt solid ${COLORS.border}`,
    paddingTop: 10,
    flexDirection: 'column',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    fontSize: 6.5,
    color: COLORS.mutedLight,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.4,
  },
});

// ============================================================================
// SAFE DATE FORMATTING
// ============================================================================
function formatIssuedDate(): string {
  try {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

// ============================================================================
// SAFE CONTENT RENDERER
// ============================================================================
function renderContent(content: string | undefined, stylesObj: any) {
  if (!content || content.trim().length === 0) {
    return (
      <View>
        <Text style={stylesObj?.paragraph || {}}>
          Analysis pending for this asset. Please consult the digital terminal.
        </Text>
      </View>
    );
  }

  try {
    // Fixed: Passing both content and the styles object to the formatter
    return formatMDXForPDF(content, stylesObj);
  } catch (error) {
    console.error('[PDF] MDX formatting failed:', error);
    return (
      <View>
        <Text style={stylesObj?.paragraph || {}}>
          Content formatting encountered an issue. Please refer to the original brief.
        </Text>
      </View>
    );
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface BriefDocumentProps {
  config: PDFConfig;
  content?: string;
}

export const BriefDocument = ({ config, content }: BriefDocumentProps) => {
  const issuedDate = formatIssuedDate();
  
  const title = config.title || 'Untitled Brief';
  const id = config.id || 'unknown';
  const tier = config.tier || 'member';
  const category = config.category || 'General Intelligence';
  const version = config.version || '1.0.0';
  const tags = Array.isArray(config.tags) ? config.tags : [];

  return (
    <Document 
      title={`${title} | Abraham of London`}
      author="Abraham of London"
      subject={`Intelligence Brief: ${title}`}
      keywords={tags.join(', ')}
      creator="Abraham of London PDF Generator"
      producer="React-PDF"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>Abraham of London</Text>
          <Text style={styles.documentId}>Ref: {id.toUpperCase()}</Text>
        </View>

        {/* Fixed: Empty object {} instead of null for type-safe style array */}
        <View style={[
          styles.tierBar, 
          tier === 'inner-circle' ? styles.tierBarInnerCircle : {}
        ]}>
          <Text>CLASSIFICATION: {tier.toUpperCase()} ACCESS ONLY</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {config.description && (
          <Text style={styles.subtitle}>{config.description}</Text>
        )}

        <View style={styles.contentBody}>
          <Text style={styles.sectionTitle}>Executive Analysis</Text>
          {renderContent(content, styles)}
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Issued</Text>
            <Text style={styles.metaValue}>{issuedDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{category}</Text>
          </View>
          {tags.length > 0 && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tags</Text>
              <Text style={styles.metaValue}>{tags.join(' • ')}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Version</Text>
            <Text style={styles.metaValue}>{version} (Stable)</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Classification</Text>
            <Text style={styles.metaValue}>{tier.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>© 2026 Abraham of London | Proprietary and Confidential</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} of ${totalPages}`
            )} />
          </View>
          <Text style={styles.disclaimerText}>
            DISCLAIMER: This document contains informed analysis and professional opinions provided by Abraham of London for informational purposes only. It does not constitute legal, financial, or professional advice. Recipients are strongly encouraged to consult with qualified licensed professionals before making any decisions based on this content. Abraham of London accepts no liability for actions taken or not taken based on the information presented herein.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BriefDocument;