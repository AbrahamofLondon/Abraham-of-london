// lib/predictive/early-warning.ts
import { TimeSeriesEngine } from './time-series-engine';
import { EarlyWarningSignal, Severity, TimeSeriesPoint } from './types';

export class EarlyWarningSystem {
  private static instance: EarlyWarningSystem | null = null;
  private timeSeriesEngine: TimeSeriesEngine;
  
  private readonly THRESHOLDS = {
    resonance: { warning: 70, critical: 50 },
    dissonance: { warning: 20, critical: 30 },
    burnout: { warning: 50, critical: 70 },
    certainty: { warning: 70, critical: 50 }
  };

  private constructor() {
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
  }

  static getInstance(): EarlyWarningSystem {
    if (!EarlyWarningSystem.instance) {
      EarlyWarningSystem.instance = new EarlyWarningSystem();
    }
    return EarlyWarningSystem.instance;
  }

  detectSignals(
    historicalPoints: TimeSeriesPoint[],
    metric: string,
    currentValue: number
  ): EarlyWarningSignal | null {
    const threshold = this.getThreshold(metric, currentValue);
    if (!threshold) return null;
    
    // Forecast future values
    const forecast = this.timeSeriesEngine.forecast(historicalPoints, 30);
    
    // Find when threshold will be crossed
    let daysToThreshold = -1;
    let projectedValue = currentValue;
    
    for (let i = 0; i < forecast.points.length; i++) {
      const point = forecast.points[i];
      if (!point) continue;

      if (metric === 'resonance' || metric === 'certainty') {
        if (point.value <= threshold && projectedValue > threshold) {
          daysToThreshold = i + 1;
          projectedValue = point.value;
          break;
        }
      } else {
        if (point.value >= threshold && projectedValue < threshold) {
          daysToThreshold = i + 1;
          projectedValue = point.value;
          break;
        }
      }

      projectedValue = point.value;
    }
    
    if (daysToThreshold === -1) return null;
    
    // Determine severity based on distance to threshold and forecast confidence
    const severity = this.determineSeverity(
      Math.abs(currentValue - threshold),
      forecast.points[daysToThreshold - 1]?.confidence || 0
    );
    
    // Identify leading indicators
    const leadingIndicators = this.getLeadingIndicators(metric);
    
    // Calculate historical accuracy of this signal type
    const historicalAccuracy = this.calculateHistoricalAccuracy(metric);
    
    return {
      id: this.generateSignalId(metric),
      metric,
      currentValue,
      threshold,
      projectedDaysToThreshold: daysToThreshold,
      severity,
      confidence: forecast.points[daysToThreshold - 1]?.confidence || 0.5,
      leadingIndicators,
      historicalAccuracy
    };
  }

  private getThreshold(metric: string, currentValue: number): number | null {
    const thresholds = this.THRESHOLDS[metric as keyof typeof this.THRESHOLDS];
    if (!thresholds) return null;
    
    // Determine which threshold applies
    if (metric === 'resonance' || metric === 'certainty') {
      if (currentValue <= thresholds.critical) return thresholds.critical;
      if (currentValue <= thresholds.warning) return thresholds.warning;
    } else {
      if (currentValue >= thresholds.critical) return thresholds.critical;
      if (currentValue >= thresholds.warning) return thresholds.warning;
    }
    
    return null;
  }

  private determineSeverity(distanceToThreshold: number, confidence: number): Severity {
    if (confidence < 0.6) return 'info';
    if (distanceToThreshold <= 5) return 'critical';
    if (distanceToThreshold <= 10) return 'warning';
    return 'info';
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

  private calculateHistoricalAccuracy(metric: string): number {
    // In production, this would query historical predictions vs actual outcomes
    // For initial implementation, return a conservative estimate
    return 0.75;
  }

  private generateSignalId(metric: string): string {
    return `ews_${metric}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}