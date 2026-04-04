// components/pdf/TelemetryReport.tsx
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register custom fonts for better styling
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter'
  },
  header: {
    marginBottom: 30,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827'
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    fontSize: 9,
    color: '#9CA3AF'
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
    borderLeft: '2px solid #8A6A2F',
    paddingLeft: 8
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  metricCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    marginBottom: 8
  },
  metricLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 1
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  metricUnit: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 2
  },
  logEntry: {
    fontSize: 7,
    fontFamily: 'Courier',
    color: '#374151',
    marginBottom: 4,
    paddingVertical: 2,
    borderBottom: '0.5px solid #F3F4F6'
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 15
  },
  alertBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
    borderLeft: '3px solid #F59E0B'
  },
  alertText: {
    fontSize: 9,
    color: '#92400E'
  },
  chartPlaceholder: {
    backgroundColor: '#F3F4F6',
    height: 120,
    marginVertical: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chartText: {
    fontSize: 9,
    color: '#6B7280'
  }
});

interface TelemetryData {
  resonance: number;
  activeNodes: number;
  logs: string[];
  metrics: {
    load: number;
    friction: number;
    dissonance: number;
    burnoutIndex: number;
    replacementLiability: number;
    avgUtilization: number;
  };
}

interface TelemetryReportProps {
  data: TelemetryData;
  campaignName?: string;
  generatedAt?: Date;
}

export const TelemetryReport = ({ 
  data, 
  campaignName = "Sovereign Alignment Registry",
  generatedAt = new Date() 
}: TelemetryReportProps) => {
  const getResonanceStatus = (resonance: number) => {
    if (resonance >= 80) return { label: "Optimal", color: "#10B981", emoji: "✅" };
    if (resonance >= 60) return { label: "Stable", color: "#F59E0B", emoji: "⚠️" };
    return { label: "Critical", color: "#EF4444", emoji: "🔴" };
  };

  const resonanceStatus = getResonanceStatus(data.resonance);
  const isDisordered = data.resonance < 60;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sovereign Telemetry Report</Text>
          <Text style={styles.subtitle}>Protocol OGR-IV • Node Canary Wharf</Text>
          <View style={styles.metadata}>
            <Text>{campaignName}</Text>
            <Text>Generated: {generatedAt.toLocaleString()}</Text>
          </View>
        </View>

        {/* Alert if system is disordered */}
        {isDisordered && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⚠️ SYSTEM ALERT: Resonance below threshold ({data.resonance}%). 
              Immediate intervention required in {Math.round(data.metrics.friction)}% of domains.
            </Text>
          </View>
        )}

        {/* Key Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Metrics</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Systemic Resonance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.metricValue}>{data.resonance}</Text>
                <Text style={styles.metricUnit}>%</Text>
              </View>
              <Text style={{ fontSize: 8, color: resonanceStatus.color, marginTop: 4 }}>
                {resonanceStatus.emoji} {resonanceStatus.label}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Active Correction Nodes</Text>
              <Text style={styles.metricValue}>{data.activeNodes}</Text>
              <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>
                In progress interventions
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>System Load</Text>
              <Text style={styles.metricValue}>{data.metrics.load}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Friction Index</Text>
              <Text style={styles.metricValue}>{data.metrics.friction}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>System Dissonance</Text>
              <Text style={styles.metricValue}>{data.metrics.dissonance.toFixed(3)}</Text>
              <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>
                {data.metrics.dissonance > 0.3 ? 'Elevated' : 'Normal'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Burnout Index</Text>
              <Text style={styles.metricValue}>{data.metrics.burnoutIndex}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Replacement Liability</Text>
              <Text style={styles.metricValue}>
                ${(data.metrics.replacementLiability / 1000).toFixed(0)}K
              </Text>
              <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>
                Estimated cost of open issues
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Average Utilization</Text>
              <Text style={styles.metricValue}>{data.metrics.avgUtilization}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>
          </View>
        </View>

        {/* Telemetry Logs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Telemetry</Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 10, borderRadius: 4 }}>
            {data.logs.slice(0, 12).map((log, idx) => (
              <Text key={idx} style={styles.logEntry}>
                {log}
              </Text>
            ))}
          </View>
        </View>

        {/* Status Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health Summary</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <Text style={{ fontSize: 9, color: '#374151' }}>
              Resolved Issues: {Math.round(data.metrics.avgUtilization)}%
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
            <Text style={{ fontSize: 9, color: '#374151' }}>
              In Progress: {data.activeNodes} active interventions
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
            <Text style={{ fontSize: 9, color: '#374151' }}>
              Open Issues: {Math.round(data.metrics.friction)}% requiring attention
            </Text>
          </View>
        </View>

        {/* Recommendation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 4 }}>
            {isDisordered ? (
              <>
                <Text style={{ fontSize: 9, marginBottom: 6, fontWeight: 'bold' }}>
                  🚨 IMMEDIATE ACTION REQUIRED
                </Text>
                <Text style={{ fontSize: 8, color: '#374151', marginBottom: 4 }}>
                  • System resonance at critical levels ({data.resonance}%)
                </Text>
                <Text style={{ fontSize: 8, color: '#374151', marginBottom: 4 }}>
                  • {data.activeNodes} active correction nodes require prioritization
                </Text>
                <Text style={{ fontSize: 8, color: '#374151' }}>
                  • Immediate intervention needed in high-friction domains
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 9, marginBottom: 6, fontWeight: 'bold' }}>
                  ✓ System Operating Within Parameters
                </Text>
                <Text style={{ fontSize: 8, color: '#374151', marginBottom: 4 }}>
                  • Maintain current correction cadence to preserve resonance
                </Text>
                <Text style={{ fontSize: 8, color: '#374151', marginBottom: 4 }}>
                  • Monitor {data.metrics.friction}% friction index for early warning signs
                </Text>
                <Text style={{ fontSize: 8, color: '#374151' }}>
                  • Continue tracking {data.activeNodes} active interventions
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Sovereign Alignment Registry v1.6 | Protocol OGR-IV</Text>
          <Text style={{ fontSize: 7, marginTop: 4 }}>
            Classification: Restricted | Node: Canary Wharf
          </Text>
        </View>
      </Page>
    </Document>
  );
};