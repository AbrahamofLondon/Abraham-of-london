import { Suspense } from "react";
import ClientReportClient from "./ClientReportClient";

export const dynamic = "force-dynamic";

export default function ClientReportPage() {
  return (
    <Suspense fallback={<main />}>
      <ClientReportClient />
    </Suspense>
  );
}
