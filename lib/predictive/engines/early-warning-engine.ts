import { TimeSeriesEngine } from './time-series-engine';
import { TimeSeriesPoint, EarlyWarningSignal, Severity } from '../types';

export class EarlyWarningEngine {
  private static instance: EarlyWarningEngine | null = null;
  private timeSeriesEngine: TimeSeriesEngine;
  
  private readonly THRESHOLDS = {
    resonance: { warning: 70, critical: 50, direction: 'below' },
    dissonance: { warning: 20, critical: 30, direction: 'above' },
    burnout: { warning: 50, critical: 70, direction: 'above' },
    certainty: { warning: 70, critical: 50, direction: 'below' }
  };

  private constructor() {
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
  }

  static getInstance(): EarlyWarningEngine {
    if (!EarlyWarningEngine.instance) {
      EarlyWarningEngine.instance = new EarlyWarningEngine();
    }
    return EarlyWarningEngine.instance;
  }

  detectSignals(
    historicalPoints: TimeSeriesPoint[],
    metric: string,
    currentValue: number
  ): EarlyWarningSignal | null {
    const thresholds = this.THRESHOLDS[metric as keyof typeof this.THRESHOLDS];
    if (!thresholds) return null;
    
    const isWarning = this.isThresholdCrossed(currentValue, thresholds.warning, thresholds.direction);
    const isCritical = this.isThresholdCrossed(currentValue, thresholds.critical, thresholds.direction);
    
    if (!isWarning && !isCritical) return null;
    
    const severity = isCritical ? 'critical' : 'warning';
    let projectedDaysToThreshold = 7;
    
    try {
      if (historicalPoints.length >= 7) {
        const forecast = this.timeSeriesEngine.forecast(historicalPoints, 30);
        const threshold = isCritical ? thresholds.critical : thresholds.warning;
        
        for (let i = 0; i < forecast.points.length; i++) {
          if (this.isThresholdCrossed(forecast.points[i].value, threshold, thresholds.direction)) {
            projectedDaysToThreshold = i + 1;
            break;
          }
        }
      }
    } catch {
      const slope = this.calculateSlope(historicalPoints);
      const diff = (isCritical ? thresholds.critical : thresholds.warning) - currentValue;
      if (slope !== 0 && diff / slope > 0) {
        projectedDaysToThreshold = Math.min(30, Math.max(1, Math.ceil(diff / slope)));
      }
    }
    
    return {
      id: `ews_${metric}_${Date.now()}`,
      metric,
      currentValue,
      threshold: isCritical ? thresholds.critical : thresholds.warning,
      projectedDaysToThreshold,
      severity: severity as Severity,
      confidence: 0.75,
      leadingIndicators: this.getLeadingIndicators(metric),
      historicalAccuracy: 0.8
    };
  }

  private isThresholdCrossed(value: number, threshold: number, direction: string): boolean {
    return direction === 'above' ? value >= threshold : value <= threshold;
  }

  private calculateSlope(points: TimeSeriesPoint[]): number {
    if (points.length < 2) return 0;
    const n = points.length;
    const values = points.map(p => p.value);
    const x = Array.from({ length: n }, (_, i) => i);
    
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (values[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private getLeadingIndicators(metric: string): string[] {
    const indicators: Record<string, string[]> = {
      resonance: ['dissonance_trend', 'correction_node_age', 'participant_sentiment'],
      dissonance: ['strategic_intent_gap', 'operational_velocity', 'communication_latency'],
      burnout: ['overtime_trend', 'vacation_usage', 'turnover_rate'],
      certainty: ['execution_authorization', 'mandate_compliance', 'audit_findings']
    };
    return indicators[metric] || [];
  }
}