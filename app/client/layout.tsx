// app/client/layout.tsx
// Token-authenticated client delivery routes — never prerendered.
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
