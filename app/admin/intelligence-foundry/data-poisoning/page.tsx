// Server wrapper for data-poisoning page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import DataPoisoningLabPageClient from "./PageClient";

export default function DataPoisoningLabPage() {
  return <DataPoisoningLabPageClient />;
}
