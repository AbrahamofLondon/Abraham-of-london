// Server wrapper for constitutional-diagnostic page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import ConstitutionalDiagnosticSimPageClient from "./PageClient";

export default function ConstitutionalDiagnosticSimPage() {
  return <ConstitutionalDiagnosticSimPageClient />;
}
