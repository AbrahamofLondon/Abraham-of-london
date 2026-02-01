@import "tailwindcss";
@config "../tailwind.config.cjs";

@layer base {
  :root {
    --brand-obsidian: #000000;
    --brand-charcoal: #050505;
    --brand-amber: #f59e0b;
    --brand-amber-glow: rgba(245, 158, 11, 0.4);
    --brand-cream: #fdfaf3;

    --meta-white: rgba(255, 255, 255, 0.4);
    --meta-border: rgba(255, 255, 255, 0.08);
  }
}

@layer components {
  .city-gate-card {
    @apply relative overflow-hidden rounded-[2rem]
      border border-white/10
      bg-white/[0.02] backdrop-blur-xl transition-all duration-500;
  }

  .city-gate-card:hover {
    @apply border-amber-500/30 bg-white/[0.04] -translate-y-1;
    box-shadow: 0 20px 40px -20px rgba(245, 158, 11, 0.1);
  }

  .text-metadata {
    @apply font-mono text-[9px] uppercase tracking-[0.4em] text-white/30;
  }

  .text-kicker {
    @apply text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80;
  }

  .heading-statement {
    @apply font-serif text-4xl md:text-6xl font-medium tracking-tight text-white leading-[1.05];
  }

  .signal-dot {
    @apply h-1.5 w-1.5 rounded-full bg-amber-500;
    box-shadow: 0 0 8px var(--brand-amber-glow);
  }
}

@layer utilities {
  .animate-protocol-shimmer {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    background-size: 200% 100%;
    animation: protocol-shimmer 2s infinite linear;
  }

  .bg-grid-technical {
    background-image:
      linear-gradient(var(--meta-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--meta-border) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .mask-radial-fade {
    mask-image: radial-gradient(circle at center, black, transparent 80%);
  }
}

@keyframes protocol-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}