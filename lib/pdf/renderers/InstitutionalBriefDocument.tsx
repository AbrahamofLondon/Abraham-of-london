/* lib/pdf/renderers/InstitutionalBriefDocument.tsx — V3.1 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import { RenderBriefBody } from "./renderBriefBody";

/* --------------------------------------------------------------------------
   BRANDING & COLORS
-------------------------------------------------------------------------- */
const INK = "#121416";
const BRASS = "#8A6A2F";
const MIST = "#E8E1D4";
const PANEL_SIDEBAR = "#FAF7F1";

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 65,
    paddingHorizontal: 50,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 25,
    borderBottomWidth: 1.5,
    borderBottomColor: INK,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerMeta: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: BRASS,
    textAlign: "right",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  
  /* Executive Frontmatter (Two-Column Layout) */
  frontmatter: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: MIST,
    paddingBottom: 20,
  },
  summarySection: {
    flex: 2,
  },
  judgementSection: {
    flex: 1,
    backgroundColor: PANEL_SIDEBAR,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: BRASS,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: BRASS,
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: "Times-Italic",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: INK,
  },
  judgementItem: {
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
    color: INK,
    marginBottom: 6,
  },

  /* Footer / Pagination */
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: MIST,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#9EA4AC",
    textTransform: "uppercase",
    letterSpacing: 1,
  }
});

interface InstitutionalBriefProps {
  title: string;
  date: string;
  id: string;
  summary: string;
  judgements: string[];
  content: string;
}

export const InstitutionalBriefDocument: React.FC<InstitutionalBriefProps> = ({
  title,
  date,
  id,
  summary,
  judgements,
  content,
}) => (
  <Document author="AOL Intelligence" title={title}>
    <Page size="A4" style={styles.page}>
      
      {/* 1. INSTITUTIONAL HEADER */}
      <View style={styles.header} fixed>
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View>
          <Text style={styles.headerMeta}>{id}</Text>
          <Text style={styles.headerMeta}>{date}</Text>
        </View>
      </View>

      {/* 2. EXECUTIVE FRONTMATTER */}
      <View style={styles.frontmatter}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionLabel}>Executive Summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
        <View style={styles.judgementSection}>
          <Text style={styles.sectionLabel}>Key Judgements</Text>
          {judgements.map((j, i) => (
            <Text key={i} style={styles.judgementItem}>• {j}</Text>
          ))}
        </View>
      </View>

      {/* 3. DYNAMIC BODY RENDERING */}
      <RenderBriefBody content={content} />

      {/* 4. FOOTER */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>AOL Institutional Intelligence Brief</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} />
      </View>

    </Page>
  </Document>
);

export default InstitutionalBriefDocument;