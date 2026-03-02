/* components/Frameworks/ProtectedFrameworkShell.tsx — BUILD-SAFE WRAPPER
   Goals:
   - NO circular imports
   - Exports both named + default
   - No content leak at build if you choose to null it
*/

import * as React from "react";

export interface ProtectedFrameworkShellProps {
  children: React.ReactNode;
}

/**
 * Build detection — if you want to ensure privileged UI does NOT render at build.
 * Note: In Pages Router, this is mostly belt-and-suspenders.
 */
const IS_BUILD =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

export const ProtectedFrameworkShell: React.FC<ProtectedFrameworkShellProps> = ({ children }) => {
  if (IS_BUILD) return null;
  return <>{children}</>;
};

export default ProtectedFrameworkShell;