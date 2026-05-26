import { Suspense } from "react";
import StrategySuccessClient from "./StrategySuccessClient";

export const dynamic = "force-dynamic";

export default function StrategySuccessPage() {
  return (
    <Suspense fallback={<main />}>
      <StrategySuccessClient />
    </Suspense>
  );
}
