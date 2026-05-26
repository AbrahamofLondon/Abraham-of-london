import { Suspense } from "react";
import PortalClient from "./PortalClient";

export const dynamic = "force-dynamic";

export default function PortalPage() {
  return (
    <Suspense fallback={<main />}>
      <PortalClient />
    </Suspense>
  );
}
