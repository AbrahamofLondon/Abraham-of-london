// components/reader/ReaderBody.tsx
// Content body wrapper for a reading surface.
// Applies the correct reader CSS class for typography.
// For Canon (warmPanel: true), wraps content in a warm bone panel.
// For Vault, renders directly on the dark scaffold.

import * as React from "react";
import { getReaderPreset, type ReaderSurface } from "@/lib/reader/reader-presets";

export type ReaderBodyProps = {
  surface: ReaderSurface;
  children: React.ReactNode;
  className?: string;
};

export default function ReaderBody({
  surface,
  children,
  className,
}: ReaderBodyProps) {
  const preset = getReaderPreset(surface);

  if (preset.warmPanel) {
    // Canon: warm bone panel on dark scaffold
    return (
      <div className="reader-body__panel-wrap">
        <div
          className={[preset.bodyClass, className].filter(Boolean).join(" ")}
        >
          {children}
        </div>
      </div>
    );
  }

  // Vault: direct on dark scaffold
  return (
    <div className={[preset.bodyClass, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
