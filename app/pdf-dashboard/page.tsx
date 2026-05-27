// app/pdf-dashboard/page.tsx
// RETIRED: Internal PDF telemetry dashboard. Not a public route.
// Redirects to the admin reporting lineage view which supersedes it.
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RetiredPdfDashboard() {
  redirect("/admin/reporting/lineage");
}
