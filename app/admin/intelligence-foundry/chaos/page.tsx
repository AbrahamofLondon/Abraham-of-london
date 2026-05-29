// Server wrapper for chaos page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import ChaosRangePageClient from "./PageClient";

export default function ChaosRangePage() {
  return <ChaosRangePageClient />;
}
