// app/dashboard/pdf-analytics/page.tsx
// RETIRED: Internal OGR-IV telemetry terminal. Not a public route.
// Redirects to the admin reporting lineage view which supersedes it.
import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function RetiredPdfAnalyticsDashboard() {
  redirect("/admin/reporting/lineage");
}
