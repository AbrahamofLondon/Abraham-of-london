/* app/downloads/vault/page.tsx — server wrapper */
import { Suspense } from "react";
import VaultBrowserClient from "./VaultBrowserClient";

export const dynamic = "force-dynamic";

export default function VaultPage() {
  return (
    <Suspense fallback={null}>
      <VaultBrowserClient />
    </Suspense>
  );
}
