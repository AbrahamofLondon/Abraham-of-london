/* app/dashboard/pdf-analytics/page.tsx — server wrapper */
import { Suspense } from "react";
import PdfAnalyticsClient from "./PdfAnalyticsClient";

export const dynamic = "force-dynamic";

export default function PdfAnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <PdfAnalyticsClient />
    </Suspense>
  );
}
