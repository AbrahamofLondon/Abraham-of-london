import { Document, Page, Text, View } from "@react-pdf/renderer";

export default function ReportDoc({ data }: any) {
  return (
    <Document>
      <Page style={{ padding: 40 }}>
        <Text style={{ fontSize: 20 }}>
          Directional Integrity Report
        </Text>

        <View style={{ marginTop: 20 }}>
          <Text>Score: {data.score}%</Text>
          <Text>Verdict: {data.verdict}</Text>
          <Text>Severity: {data.severity}</Text>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text>Observations:</Text>
          <Text>{JSON.stringify(data.responses, null, 2)}</Text>
        </View>
      </Page>
    </Document>
  );
}