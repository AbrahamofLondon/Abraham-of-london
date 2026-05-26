import { Suspense } from "react";
import ClientPortalClient from "./ClientPortalClient";

export const dynamic = "force-dynamic";

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<main />}>
      <ClientPortalClient />
    </Suspense>
  );
}
