// Server wrapper for debug page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import FoundryDebugPageClient from "./PageClient";

export default function FoundryDebugPage() {
  return <FoundryDebugPageClient />;
}
