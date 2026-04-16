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

  return (
    <main
      className={[preset.scaffoldClass, preset.frameClass, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
