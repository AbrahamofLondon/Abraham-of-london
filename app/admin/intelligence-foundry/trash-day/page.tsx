// Server wrapper for trash-day page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import TrashDayPageClient from "./PageClient";

export default function TrashDayPage() {
  return <TrashDayPageClient />;
}
