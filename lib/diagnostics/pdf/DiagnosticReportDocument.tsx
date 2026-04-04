import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { DiagnosticRecordDTO } from "@/lib/diagnostics/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: "#111111",
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
  },
  sub: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  heading: {
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    marginBottom: 4,
  },
  small: {
    fontSize: 9,
    color: "#666666",
  },
});

export default function DiagnosticReportDocument({
  record,
}: {
  record: DiagnosticRecordDTO;
}) {
  const responses = Object.entries(record.responses || {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Diagnostic Report</Text>
        <Text style={styles.sub}>Reference: {record.id}</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Summary</Text>
          <Text style={styles.row}>Type: {record.diagnosticType}</Text>
          <Text style={styles.row}>Score: {record.score}%</Text>
          <Text style={styles.row}>Severity: {record.severity}</Text>
          <Text style={styles.row}>Verdict: {record.verdict}</Text>
          <Text style={styles.row}>Created: {new Date(record.createdAt).toLocaleString("en-GB")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Notes</Text>
          <Text>{record.notes || "No analyst notes recorded."}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Response Matrix</Text>
          {responses.length ? (
            responses.map(([key, value]) => (
              <Text key={key} style={styles.row}>
                {key}: {value ? "Yes" : "No"}
              </Text>
            ))
          ) : (
            <Text>No response data available.</Text>
          )}
        </View>

        <Text style={styles.small}>
          Abraham of London — structured diagnostic output.
        </Text>
      </Page>
    </Document>
  );
}