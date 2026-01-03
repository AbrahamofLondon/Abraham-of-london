import React, { useEffect, useState, useRef } from 'react';
import styles from './LegacyDiagram.module.css';

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
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <h3 className={styles.title}>The Legacy Architecture Framework</h3>
        <p className={styles.subtitle}>Five components for intentional endurance</p>
      </div>

      <div className={styles.diagram}>
        {/* Core Thesis at center with animation */}
        <div
          className={`${styles.core} ${animated ? styles.coreAnimated : ''}`}
          style={{
            animationDelay: '0.2s',
          }}
        >
          <div className={styles.coreIcon}>⚡</div>
          <div className={styles.coreContent}>
            <h4>Legacy Core</h4>
            <p>Generative Principle</p>
          </div>
        </div>

        {/* Animated connecting ring */}
        <div
          className={`${styles.ring} ${animated ? styles.ringAnimated : ''}`}
          style={{
            animationDelay: '0.3s',
          }}
        ></div>

        {/* Framework steps with staggered animation */}
        <div className={styles.stepsContainer}>
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
                className={`${styles.step} ${animated ? styles.stepAnimated : ''} ${
                  isHovered ? styles.stepHovered : ''
                }`}
                style={{
                  transform: `translate(calc(50% + ${x}px), calc(50% + ${y}px))`,
                  animationDelay: `${animationDelay}s`,
                  '--step-color': step.color,
                }}
                onMouseEnter={() => handleStepHover(step.id)}
                onMouseLeave={handleStepLeave}
              >
                <div
                  className={styles.stepIcon}
                  style={{
                    backgroundColor: `${step.color}20`,
                    borderColor: step.color,
                    animationDelay: `${animationDelay + 0.1}s`,
                  }}
                >
                  <span className={styles.icon}>{step.icon}</span>
                  <div className={styles.pulseRing} />
                </div>
                <div className={styles.stepContent}>
                  <h5>{step.title}</h5>
                  <p>{step.description}</p>
                  <div className={styles.stepNumber}>{step.id}</div>
                  <div className={styles.stepLayer} style={{ color: step.color }}>
                    {step.layer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated connecting lines */}
        <svg className={styles.lines} width="100%" height="100%">
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
                  className={`${styles.line} ${animated ? styles.lineAnimated : ''}`}
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
                    className={styles.lineGlow}
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
        <svg className={styles.radialLines} width="100%" height="100%">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              className={`${styles.radialLine} ${animated ? styles.radialLineAnimated : ''}`}
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

      <div className={`${styles.legend} ${animated ? styles.legendAnimated : ''}`}>
        {frameworkSteps.map((step) => (
          <div key={step.id} className={styles.legendItem}>
            <div
              className={styles.legendDot}
              style={{ backgroundColor: step.color }}
            ></div>
            <span>{step.layer} Layer</span>
          </div>
        ))}
      </div>

      {/* Interactive hint */}
      <div className={`${styles.hint} ${animated ? styles.hintAnimated : ''}`}>
        <span className={styles.hintIcon}>👆</span>
        <span>Hover over any component to see connections</span>
      </div>
    </div>
  );
};

export default LegacyDiagram;