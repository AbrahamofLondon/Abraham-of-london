// components/mdx/CTAPreset.tsx
import { getCtaPreset, type CTAKey } from "./cta-presets";

interface CTAPresetProps {
  presetKey: CTAKey;
  className?: string;
}

export function CTAPreset({ presetKey, className = "" }: CTAPresetProps) {
  const preset = getCtaPreset(presetKey);

  if (!preset) {
    console.warn(`CTA preset not found: ${presetKey}`);
    return null;
  }

  return (
    <div
      className={`cta-preset cta-preset-${preset.theme || "default"} ${className}`}
    >
      <h3>{preset.title}</h3>
      {preset.description && <p>{preset.description}</p>}

      {/* Render your CTA items here */}
      <div className="cta-items">
        {/* Implementation depends on your design system */}
      </div>
    </div>
  );
}
