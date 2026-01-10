import React, { useEffect, useState, useRef } from 'react';

const LegacyDiagram = () => {
  const [animated, setAnimated] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setAnimated(true);
            }, 300);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '50px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const frameworkSteps = [
    {
      id: 1,
      title: 'Sovereign Thesis',
      description: 'Define the non-negotiable core principle',
      icon: '🎯',
      color: '#7C3AED',
      layer: 'Foundation',
    },
    {
      id: 2,
      title: 'Capital Matrix',
      description: 'Map human, intellectual, social & financial capitals',
      icon: '🗺️',
      color: '#10B981',
      layer: 'Capital',
    },
    {
      id: 3,
      title: 'Institutions',
      description: 'Design stewarding bodies & governance structures',
      icon: '🏛️',
      color: '#3B82F6',
      layer: 'Structure',
    },
    {
      id: 4,
      title: 'Rituals',
      description: 'Establish review cadences & decision rhythms',
      icon: '🔄',
      color: '#F59E0B',
      layer: 'Practice',
    },
    {
      id: 5,
      title: 'Guardrails',
      description: 'Engineer safeguards against failure modes',
      icon: '🛡️',
      color: '#EF4444',
      layer: 'Protection',
    },
  ];

  const handleStepHover = (stepId) => {
    setHoveredStep(stepId);
  };

  const handleStepLeave = () => {
    setHoveredStep(null);
  };

  return (
    <div ref={containerRef} className="relative p-8 rounded-3xl bg-gradient-to-br from-black/90 via-charcoal to-black border border-white/10 shadow-2xl overflow-hidden my-12">
      <div className="text-center mb-12">
        <h3 className="font-serif text-2xl font-bold text-cream mb-3">The Legacy Architecture Framework</h3>
        <p className="text-lg text-gold/70">Five components for intentional endurance</p>
      </div>

      <div className="relative w-full max-w-4xl mx-auto aspect-square">
        {/* Core Thesis at center with animation */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-purple-900/30 via-black to-purple-900/30 border-2 border-purple-500/50 flex flex-col items-center justify-center shadow-lg shadow-purple-900/20 transition-all duration-500 ${
            animated ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-center">
            <h4 className="text-lg font-semibold text-white mb-1">Legacy Core</h4>
            <p className="text-sm text-gray-400">Generative Principle</p>
          </div>
        </div>

        {/* Animated connecting ring */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-purple-500/20 ${
            animated ? 'animate-ping opacity-100' : 'opacity-0'
          }`}
          style={{ animationDelay: '0.3s' }}
        ></div>

        {/* Framework steps with staggered animation */}
        <div className="absolute inset-0">
          {frameworkSteps.map((step, index) => {
            const angle = (index * (360 / frameworkSteps.length)) * (Math.PI / 180);
            const radius = 180;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const isHovered = hoveredStep === step.id;
            const animationDelay = 0.4 + index * 0.1;

            return (
              <div
                key={step.id}
                className={`absolute w-48 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  animated ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                } ${isHovered ? 'scale-110 z-10' : ''}`}
                style={{
                  transform: `translate(calc(50% + ${x}px), calc(50% + ${y}px))`,
                  animationDelay: `${animationDelay}s`,
                }}
                onMouseEnter={() => handleStepHover(step.id)}
                onMouseLeave={handleStepLeave}
              >
                <div
                  className="relative w-12 h-12 rounded-xl border-2 flex items-center justify-center mb-3 mx-auto transition-all duration-300"
                  style={{
                    backgroundColor: `${step.color}20`,
                    borderColor: step.color,
                    animationDelay: `${animationDelay + 0.1}s`,
                  }}
                >
                  <span className="text-xl">{step.icon}</span>
                  <div className="absolute inset-0 rounded-xl border-2 border-current opacity-0 animate-ping" />
                </div>
                <div className="text-center">
                  <h5 className="font-semibold text-white mb-1">{step.title}</h5>
                  <p className="text-sm text-gray-400">{step.description}</p>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-charcoal border border-white/20 flex items-center justify-center text-xs font-bold">
                    {step.id}
                  </div>
                  <div
                    className="mt-2 text-xs font-semibold tracking-wider uppercase"
                    style={{ color: step.color }}
                  >
                    {step.layer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated connecting lines */}
        <svg className="absolute inset-0" width="100%" height="100%">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
              <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>
          </defs>
          {frameworkSteps.map((step, index) => {
            const angle = (index * (360 / frameworkSteps.length)) * (Math.PI / 180);
            const radius = 180;
            const x2 = radius * 0.9 * Math.cos(angle);
            const y2 = radius * 0.9 * Math.sin(angle);
            const lineAnimationDelay = 0.5 + index * 0.1;
            const isHovered = hoveredStep === step.id;

            return (
              <g key={step.id}>
                <line
                  className={`transition-all duration-300 ${
                    animated ? 'opacity-100 animate-dashdraw' : 'opacity-0'
                  }`}
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${x2}px)`}
                  y2={`calc(50% + ${y2}px)`}
                  stroke={isHovered ? step.color : '#D1D5DB'}
                  strokeWidth={isHovered ? '3' : '2'}
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                  style={{
                    animationDelay: `${lineAnimationDelay}s`,
                    transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                  }}
                />
                {isHovered && (
                  <line
                    className="blur-sm"
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${x2}px)`}
                    y2={`calc(50% + ${y2}px)`}
                    stroke="url(#lineGradient)"
                    strokeWidth="8"
                    strokeOpacity="0.2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Animated radial lines */}
        <svg className="absolute inset-0" width="100%" height="100%">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              className={animated ? 'opacity-100' : 'opacity-0'}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${200 * Math.cos((i * 30 * Math.PI) / 180)}px)`}
              y2={`calc(50% + ${200 * Math.sin((i * 30 * Math.PI) / 180)}px)`}
              stroke="rgba(124, 58, 237, 0.05)"
              strokeWidth="1"
              style={{
                animationDelay: `${0.1 + i * 0.05}s`,
              }}
            />
          ))}
        </svg>
      </div>

      <div className={`mt-12 flex flex-wrap justify-center gap-4 transition-opacity duration-500 ${
        animated ? 'opacity-100' : 'opacity-0'
      }`}>
        {frameworkSteps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: step.color }}
            ></div>
            <span className="text-sm text-gray-400">{step.layer} Layer</span>
          </div>
        ))}
      </div>

      {/* Interactive hint */}
      <div className={`mt-6 text-center text-sm text-gold/60 flex items-center justify-center gap-2 transition-opacity duration-500 ${
        animated ? 'opacity-100' : 'opacity-0'
      }`}>
        <span className="text-base">👆</span>
        <span>Hover over any component to see connections</span>
      </div>
    </div>
  );
};

export default LegacyDiagram;
