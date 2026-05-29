// Server wrapper for report-lineage page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import ReportLineageSimulationPageClient from "./PageClient";

export default function ReportLineageSimulationPage() {
  return <ReportLineageSimulationPageClient />;
}
