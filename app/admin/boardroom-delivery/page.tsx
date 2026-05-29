// Server wrapper for boardroom-delivery page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import BoardroomDeliveryPageClient from "./PageClient";

export default function BoardroomDeliveryPage() {
  return <BoardroomDeliveryPageClient />;
}
