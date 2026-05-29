// Server wrapper for decision-intelligence page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import DecisionIntelligencePageClient from "./PageClient";

export default function DecisionIntelligencePage() {
  return <DecisionIntelligencePageClient />;
}
