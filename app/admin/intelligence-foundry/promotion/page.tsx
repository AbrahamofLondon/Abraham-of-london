// Server wrapper for promotion page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import PromotionWorkflowPageClient from "./PageClient";

export default function PromotionWorkflowPage() {
  return <PromotionWorkflowPageClient />;
}
