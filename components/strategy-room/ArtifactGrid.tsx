// components/strategy-room/ArtifactGrid.tsx
"use client";

import * as React from "react";

export default function ArtifactGrid({ hasAccess }: { hasAccess: boolean }) {
  // Client-only component
  return (
    <div>
      {/* Artifacts grid */}
      {hasAccess ? (
        <div>Show premium artifacts</div>
      ) : (
        <div>Show public artifacts</div>
      )}
    </div>
  );
}