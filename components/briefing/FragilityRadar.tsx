import React from 'react';

// Maps domain keys to human-readable labels used in the UI
const DOMAIN_LABELS: Record<string, string> = {
  STRATEGY: 'Strategy',
  CANON: 'Canon',
  LIBRARY: 'Library',
  ARTIFACTS: 'Intelligence Archives',
  BRIEFS: 'Briefs',
  VENTURES: 'Ventures',
  SHORTS: 'Shorts',
};

// Colors associated with fragility levels
const FRAGILITY_COLORS = {
  HIGH: '#f59e0b', // brand.amber
  MEDIUM: '#d6b26a', // softGold
  LOW: '#b89b6e', // brand.gold
};

interface FragilityRadarProps {
  fragilitySignal: 'HIGH' | 'MEDIUM' | 'LOW';
  varianceScores: Array<{ domain: string; variance: number }>;
  dissonanceArea: number; // The area calculated in aggregation
}

export const FragilityRadar: React.FC<FragilityRadarProps> = ({
  fragilitySignal,
  varianceScores,
  dissonanceArea,
}) => {
  const size = 300; // SVG ViewBox size
  const center = size / 2;
  const maxRadius = size * 0.4; // Leave room for labels
  const maxVariance = 40; // Variance above this is considered critical for visualization
  const numDomains = varianceScores.length;

  // Helper to calculate SVG coordinates (x, y) for a given domain index and variance value
  const getCoordinates = (index: number, value: number) => {
    const angle = (index * (2 * Math.PI)) / numDomains - Math.PI / 2; // Start from the top
    const radius = (value / maxVariance) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // Generate points for the shape (variance area)
  const shapePoints = varianceScores
    .map((score, i) => {
      const { x, y } = getCoordinates(i, Math.min(score.variance, maxVariance));
      return `${x},${y}`;
    })
    .join(' ');

  // Generate lines for the background grid (max variance boundary)
  const gridPoints = varianceScores
    .map((_, i) => {
      const { x, y } = getCoordinates(i, maxVariance);
      return `${x},${y}`;
    })
    .join(' ');

  const signalColor = FRAGILITY_COLORS[fragilitySignal];

  return (
    <div className="city-gate-card p-8 flex flex-col gap-6 shadow-premium">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-serif text-brand-cream">Fragility Radar</h3>
          <p className="text-xs text-brand-cream-dim">Signal variance across standard domains.</p>
        </div>
        
        {/* The quantitative "Expensive" signal */}
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-institutional text-brand-cream-muted">Dissonance Area</div>
          <div className="text-3xl font-serif text-shadow-gold" style={{ color: signalColor }}>
            {dissonanceArea.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="relative flex justify-center items-center">
        {/* SVG Visualization */}
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-sm">
          {/* Background Grid (Octagon) */}
          <polygon
            points={gridPoints}
            className="fill-none stroke-brand-charcoal stroke-[0.5]"
          />
          {/* Axis Lines */}
          {varianceScores.map((_, i) => {
            const { x, y } = getCoordinates(i, maxVariance);
            return (
              <line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                className="stroke-brand-charcoal stroke-[0.5]"
              />
            );
          })}

          {/* Critical Variance Boundary (Glow effect) */}
          <polygon
            points={gridPoints}
            className="fill-none stroke-dasharray-4 opacity-50"
            style={{ stroke: signalColor, filter: `drop-shadow(0 0 6px ${signalColor})` }}
          />

          {/* The Data Shape (Filled with signal color) */}
          <polygon
            points={shapePoints}
            style={{ fill: signalColor }}
            className="opacity-60 transition-all duration-500 ease-in-out"
          />
        </svg>
        
        {/* Absoloute Positioned Labels (Institutional Mono) */}
        {varianceScores.map((score, i) => {
          // Calculate label position slightly outside the grid boundary
          const labelPos = getCoordinates(i, maxVariance + 6);
          
          // Basic text anchor logic based on horizontal position
          const textAnchor = labelPos.x > center + 10 ? 'start' : labelPos.x < center - 10 ? 'end' : 'middle';
          
          return (
            <div 
              key={`label-${score.domain}`}
              className="absolute font-mono text-[9px] uppercase tracking-forensic text-brand-cream-muted"
              style={{
                left: `${(labelPos.x / size) * 100}%`,
                top: `${(labelPos.y / size) * 100}%`,
                transform: 'translate(-50%, -50%)',
                textAlign: textAnchor === 'middle' ? 'center' : textAnchor === 'start' ? 'left' : 'right',
                whiteSpace: 'nowrap'
              }}
            >
              {DOMAIN_LABELS[score.domain] || score.domain}
            </div>
          );
        })}
      </div>
      
      {/* Legend / Status Pill */}
      <div className="flex justify-center mt-2">
        <div 
          className="city-gate-pill flex items-center gap-2 border-opacity-40"
          style={{ borderColor: signalColor, color: signalColor, boxShadow: `0 0 20px ${signalColor}20` }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: signalColor }} />
          <span>{fragilitySignal} FRAGILITY SIGNAL</span>
        </div>
      </div>
    </div>
  );
};