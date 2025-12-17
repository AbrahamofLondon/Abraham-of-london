// components/Rule.tsx
import * as React from "react";

/**
 * Decorative separator used in MDX as <Rule />.
 * Safe, no props required.
 */
export default function Rule(): JSX.Element {
  return (
    <div
      className="my-8 flex items-center"
      role="separator"
      aria-orientation="horizontal"
    >
      <span className="h-px flex-1 bg-lightGrey" />
      <span className="mx-3 text-xs uppercase tracking-[0.25em] text-softGold">
        Selah
      </span>
      <span className="h-px flex-1 bg-lightGrey" />
    </div>
  );
}