/* app/pdf-dashboard/page.tsx — server wrapper */
import { Suspense } from "react";
import PdfDashboardClient from "./PdfDashboardClient";

export const dynamic = "force-dynamic";

export default function PdfDashboardPage() {
  return (
    <Suspense fallback={null}>
      <PdfDashboardClient />
    </Suspense>
  );
}
