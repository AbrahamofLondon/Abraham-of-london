// components/reader/ReaderFrame.tsx
// Top-level wrapper for a reading surface.
// Provides the dark scaffold and page-level structure.

import * as React from "react";
import { getReaderPreset, type ReaderSurface } from "@/lib/reader/reader-presets";

export type ReaderFrameProps = {
  surface: ReaderSurface;
  children: React.ReactNode;
  className?: string;
};

export default function ReaderFrame({
  surface,
  children,
  className,
}: ReaderFrameProps) {
  const preset = getReaderPreset(surface);

  // Renders as <div>, not <main> — Layout already provides the semantic
  // <main> element. A nested <main> would be invalid HTML and would stack
  // padding (Layout's pt-[84px] + reader-header's padding-top).
  return (
    <div
      className={[preset.scaffoldClass, preset.frameClass, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
