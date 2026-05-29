// Server wrapper for market page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import MarketResponseLabPageClient from "./PageClient";

export default function MarketResponseLabPage() {
  return <MarketResponseLabPageClient />;
}
