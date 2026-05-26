import { Suspense } from "react";
import AssessmentSuccessClient from "./AssessmentSuccessClient";

export const dynamic = "force-dynamic";

export default function AssessmentSuccessPage() {
  return (
    <Suspense fallback={<main />}>
      <AssessmentSuccessClient />
    </Suspense>
  );
}
