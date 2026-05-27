/* app/pdf-dashboard/page.tsx — server wrapper */
import { Suspense } from "react";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import PdfDashboardClient from "./PdfDashboardClient";

export const dynamic = "force-dynamic";

export default async function PdfDashboardPage() {
  await requireAdminServer();

  return (
    <Suspense fallback={null}>
      <PdfDashboardClient />
    </Suspense>
  );
}
