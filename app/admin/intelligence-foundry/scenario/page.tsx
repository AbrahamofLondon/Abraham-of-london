// Server wrapper for scenario page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import ScenarioWorkbenchPageClient from "./PageClient";

export default function ScenarioWorkbenchPage() {
  return <ScenarioWorkbenchPageClient />;
}
