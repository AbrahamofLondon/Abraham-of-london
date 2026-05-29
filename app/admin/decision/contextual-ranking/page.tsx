// Server wrapper for contextual-ranking page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import AdminContextualRankingPageClient from "./PageClient";

export default function AdminContextualRankingPage() {
  return <AdminContextualRankingPageClient />;
}
