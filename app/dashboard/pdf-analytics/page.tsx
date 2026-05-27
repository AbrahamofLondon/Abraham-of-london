/* app/dashboard/pdf-analytics/page.tsx — server wrapper */
import { Suspense } from "react";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import PdfAnalyticsClient from "./PdfAnalyticsClient";

export const dynamic = "force-dynamic";

export default async function PdfAnalyticsPage() {
  await requireAdminServer();

  return (
    <Suspense fallback={null}>
      <PdfAnalyticsClient />
    </Suspense>
  );
}
