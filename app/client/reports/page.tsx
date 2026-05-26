import { Suspense } from "react";
import ClientReportsClient from "./ClientReportsClient";

export const dynamic = "force-dynamic";

export default function ClientReportsPage() {
  return (
    <Suspense fallback={<main />}>
      <ClientReportsClient />
    </Suspense>
  );
}
