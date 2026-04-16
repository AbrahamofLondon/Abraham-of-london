// components/reader/ReaderHeader.tsx
// Title block for a reading surface.
// Renders eyebrow, title, optional subtitle/meta, and a divider.

import * as React from "react";
import { getReaderPreset, type ReaderSurface } from "@/lib/reader/reader-presets";

export type ReaderMetaItem = {
  label: string;
  value: string;
};

export type ReaderHeaderProps = {
  surface: ReaderSurface;
  title: string;
  subtitle?: string | null;
  meta?: ReaderMetaItem[];
  /** Override the default eyebrow label from the preset */
  eyebrow?: string;
  className?: string;
};

export default function ReaderHeader({
  surface,
  title,
  subtitle,
  meta,
  eyebrow: eyebrowOverride,
  className,
}: ReaderHeaderProps) {
  const preset = getReaderPreset(surface);
  const eyebrow = eyebrowOverride ?? preset.eyebrow;

  return (
    <header
      className={["reader-header", `reader-header--${surface}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Eyebrow — quiet orientation */}
      <div className="reader-header__eyebrow">
        <span className="reader-header__accent-line" aria-hidden="true" />
        <span>{eyebrow}</span>
      </div>

      {/* Title */}
      <h1 className={`reader-header__title reader-header__title--${surface}`}>
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle ? (
        <p className="reader-header__subtitle">{subtitle}</p>
      ) : null}

      {/* Meta row */}
      {meta && meta.length > 0 ? (
        <div className="reader-header__meta">
          {meta.map((item, i) => (
            <span key={i}>{item.value}</span>
          ))}
        </div>
      ) : null}

      {/* Divider */}
      <div className="reader-header__divider" aria-hidden="true" />
    </header>
  );
}
