// components/Frameworks/ProtectedFrameworkShell.tsx
import * as React from "react";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";
import PrivateFrameworkView from "./PrivateFrameworkView";

export interface ProtectedFrameworkShellProps {
  // keep your real props here
}

const IS_BUILD =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

const BuildShell: React.FC<ProtectedFrameworkShellProps> = () => null;

const RuntimeShell = withUnifiedAuth(PrivateFrameworkView, {
  requiredRole: "inner-circle",
  publicFallback: false,
});

const ProtectedFrameworkShell = IS_BUILD ? BuildShell : RuntimeShell;

export default ProtectedFrameworkShell;