// Server wrapper for product-health page
// Auth and data loading handled by parent layout (app/admin/layout.tsx)
import ProductHealthPageClient from "./PageClient";

export default function ProductHealthPage() {
  return <ProductHealthPageClient />;
}
