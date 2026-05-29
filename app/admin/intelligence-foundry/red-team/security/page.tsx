// Server wrapper for security page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import SecurityRedTeamPageClient from "./PageClient";

export default function SecurityRedTeamPage() {
  return <SecurityRedTeamPageClient />;
}
