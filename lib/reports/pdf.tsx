/* lib/reports/pdf.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from "fs";
import path from "path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 10,
    color: "#8A6A2F",
    textTransform: "uppercase",
  },
  h1: {
    fontSize: 24,
    marginBottom: 12,
  },
  h2: {
    fontSize: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  p: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  meta: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
  },
  section: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  box: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
});

function ReportDocument({ report }: { report: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Abraham of London — Executive Reporting</Text>
        <Text style={styles.h1}>{report.title || "Strategic Report"}</Text>

        <Text style={styles.meta}>Reference: {report.reference}</Text>
        <Text style={styles.meta}>Diagnostic Type: {report.diagnosticType || "—"}</Text>
        <Text style={styles.meta}>Created: {report.createdAt || "—"}</Text>
        <Text style={styles.meta}>Prepared For: {report.userEmail || "Private Client"}</Text>

        <View style={styles.section}>
          <Text style={styles.h2}>Executive Summary</Text>
          <Text style={styles.p}>
            {report.executiveSummary ||
              "This report translates diagnostic signal into an actionable strategic reading."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Key Findings</Text>
          {(Array.isArray(report.keyFindings) ? report.keyFindings : []).map(
            (item: string, i: number) => (
              <Text key={i} style={styles.p}>
                • {item}
              </Text>
            ),
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Risk & Exposure</Text>
          <Text style={styles.p}>
            {report.riskSummary || "Risk interpretation not yet provided."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Correction Priorities</Text>
          {(Array.isArray(report.correctionPriorities)
            ? report.correctionPriorities
            : []
          ).map((item: string, i: number) => (
            <Text key={i} style={styles.p}>
              {i + 1}. {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Advisory Recommendation</Text>
          <Text style={styles.p}>
            {report.advisoryRecommendation || "No advisory recommendation recorded."}
          </Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.meta}>
            This report is confidential and intended only for the authorised recipient.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderReportPdfToPublic(report: any): Promise<string> {
  const instance = pdf(<ReportDocument report={report} />);
  const buffer = await instance.toBuffer();

  const dir = path.join(process.cwd(), "public", "generated-reports");
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${report.reference || report.id || "report"}.pdf`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, buffer);

  return `/generated-reports/${filename}`;
}