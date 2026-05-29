// Server wrapper for commercial page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import CommercialAdminPageClient from "./PageClient";

export default function CommercialAdminPage() {
  return <CommercialAdminPageClient />;
}
