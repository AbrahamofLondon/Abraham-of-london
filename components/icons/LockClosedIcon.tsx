// components/icons/LockClosedIcon.tsx
import * as React from "react";
import type { SVGProps } from "react";
import { Lock } from "lucide-react";

/**
 * Shared lock icon for Canon + Inner Circle UIs.
 * Keeps all imports consistent at "@/components/icons/LockClosedIcon".
 */
export default function LockClosedIcon(
  props: SVGProps<SVGSVGElement>
): JSX.Element {
  return <Lock {...props} />;
}
