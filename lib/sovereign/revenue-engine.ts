import "server-only";

import { listMandates } from "./mandate-store";

export function calculateRevenue() {
  const mandates = listMandates();

  return mandates
    .filter((m) => m.status === "ACCEPTED" || m.status === "COMPLETED")
    .reduce((sum, m) => sum + m.commercial.value, 0);
}