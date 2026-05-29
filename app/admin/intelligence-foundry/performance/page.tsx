// Server wrapper for performance page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import PerformanceRangePageClient from "./PageClient";

export default function PerformanceRangePage() {
  return <PerformanceRangePageClient />;
}
