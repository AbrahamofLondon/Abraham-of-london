import { Suspense } from "react";
import BoardroomDossierClient from "./BoardroomDossierClient";

export const dynamic = "force-dynamic";

export default function BoardroomDossierPage() {
  return (
    <Suspense fallback={<main />}>
      <BoardroomDossierClient />
    </Suspense>
  );
}
