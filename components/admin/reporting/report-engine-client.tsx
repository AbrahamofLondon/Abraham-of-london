'use client';

import React, { useState } from 'react';
import { DissonanceMatrix, MatrixMode } from './dissonance-matrix';
import { TelemetrySwitcher } from './telemetry-switcher';

interface ReportEngineClientProps {
  strategicMetrics: any[];
  humanCapitalMetrics: any[];
  financialMetrics: any[];
  operationalMetrics: any[];
  governanceMetrics?: any[];
}

/**
 * REPORT ENGINE CLIENT
 * Manages the state of the polymorphic report views.
 */
export function ReportEngineClient({
  strategicMetrics,
  humanCapitalMetrics,
  financialMetrics,
  operationalMetrics,
  governanceMetrics = [],
}: ReportEngineClientProps) {
  const [activeMode, setActiveMode] = useState<MatrixMode>('STRATEGIC');

  // Select the appropriate dataset based on the active mode
  const activeMetrics: any[] = {
    STRATEGIC: strategicMetrics,
    HUMAN_CAPITAL: humanCapitalMetrics,
    FINANCIAL: financialMetrics,
    OPERATIONAL: operationalMetrics,
    GOVERNANCE: governanceMetrics,
  }[activeMode] ?? [];

  return (
    <div className="space-y-12">
      {/* 01 // Interactive Controller */}
      <TelemetrySwitcher 
        currentMode={activeMode} 
        onModeChange={setActiveMode} 
      />

      {/* 02 // The Polymorphic Matrix */}
      <section className="animate-in fade-in zoom-in-95 duration-500">
        <DissonanceMatrix 
          metrics={activeMetrics} 
          mode={activeMode} 
          cohortSize={activeMode === 'HUMAN_CAPITAL' ? 124 : 72}
        />
      </section>
    </div>
  );
}