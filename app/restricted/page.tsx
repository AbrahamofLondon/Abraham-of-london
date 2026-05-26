import { Suspense } from "react";
import RestrictedClient from "./RestrictedClient";

export const dynamic = "force-dynamic";

export default function RestrictedPage() {
  return (
    <Suspense fallback={<main />}>
      <RestrictedClient />
    </Suspense>
  );
}
