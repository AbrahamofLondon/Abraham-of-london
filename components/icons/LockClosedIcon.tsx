// components/icons/LockClosedIcon.tsx

import * as React from "react";
import type { SVGProps } from "react";
import { Lock } from "lucide-react";

/**
 * Simple wrapper so existing Canon / Inner Circle components
 * can use a shared "LockClosedIcon" without import errors.
 */
export default function LockClosedIcon(
  props: SVGProps<SVGSVGElement>,
): JSX.Element {
  // Forward all props so callers can control className, size, etc.
  return <Lock {...props} />;
}