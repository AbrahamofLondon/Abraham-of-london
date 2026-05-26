import { Suspense } from "react";
import ClientActionsClient from "./ClientActionsClient";

export const dynamic = "force-dynamic";

export default function ClientActionsPage() {
  return (
    <Suspense fallback={<main />}>
      <ClientActionsClient />
    </Suspense>
  );
}
