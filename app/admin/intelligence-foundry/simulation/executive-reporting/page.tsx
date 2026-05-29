// Server wrapper for executive-reporting page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import ExecutiveReportingSimulatorPageClient from "./PageClient";

export default function ExecutiveReportingSimulatorPage() {
  return <ExecutiveReportingSimulatorPageClient />;
}
