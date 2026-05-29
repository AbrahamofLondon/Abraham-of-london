// Server wrapper for health page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import FoundryHealthPageClient from "./PageClient";

export default function FoundryHealthPage() {
  return <FoundryHealthPageClient />;
}
