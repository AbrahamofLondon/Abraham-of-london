import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { LeadershipGapView, OrganisationSnapshotView, OrganisationSummary } from '@/lib/services/database';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#1A1A1A', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { marginTop: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', backgroundColor: '#F3F4F6', padding: 6, marginBottom: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#EEE', paddingVertical: 8, alignItems: 'center' },
  label: { flex: 2, fontSize: 10, color: '#333' },
  value: { flex: 1, fontSize: 10, textAlign: 'right', fontWeight: 'bold' },
  delta: { flex: 1, fontSize: 10, textAlign: 'right' },
  flagBox: { marginTop: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#E11D48', backgroundColor: '#FFF1F2' },
  flagText: { fontSize: 9, color: '#9F1239', fontStyle: 'italic' }
});

export const ExecutiveSummaryReport = ({ 
  org, 
  snapshot, 
  gap 
}: { 
  org: OrganisationSummary, 
  snapshot: OrganisationSnapshotView, 
  gap: LeadershipGapView 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enterprise Alignment Brief</Text>
        <Text style={styles.subtitle}>{org.name} | Confidential Executive Intelligence</Text>
      </View>

      {/* Overall Standing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organizational Health: {snapshot.band}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Alignment Score</Text>
          <Text style={styles.value}>{snapshot.percentScore}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Leadership Gap (Overall Variance)</Text>
          <Text style={styles.value}>{gap.overallGapPercent}%</Text>
        </View>
      </View>

      {/* Leadership Gap Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Domain Divergence (Executive vs. Operations)</Text>
        {gap.domainGaps.map((g) => (
          <View key={g.domain} style={styles.row}>
            <Text style={styles.label}>{g.domain.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={[styles.delta, { color: Math.abs(g.delta) > 15 ? '#E11D48' : '#1A1A1A' }]}>
              {g.delta > 0 ? `+${g.delta}%` : `${g.delta}%`} Delta
            </Text>
          </View>
        ))}
      </View>

      {/* Strategic Flags */}
      {gap.interpretationFlags.length > 0 && (
        <View style={styles.flagBox}>
          {gap.interpretationFlags.map((flag, i) => (
            <Text key={i} style={styles.flagText}>• {flag}</Text>
          ))}
        </View>
      )}
    </Page>
  </Document>
);