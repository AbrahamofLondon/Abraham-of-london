import { Suspense } from "react";
import ClientDossiersClient from "./ClientDossiersClient";

export const dynamic = "force-dynamic";

export default function ClientDossiersPage() {
  return (
    <Suspense fallback={<main />}>
      <ClientDossiersClient />
    </Suspense>
  );
}
