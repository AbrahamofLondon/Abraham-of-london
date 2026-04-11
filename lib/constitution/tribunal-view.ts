import { listDriftFlags, listTribunalCases } from "./observability-store";

export function buildTribunalDashboardView() {
  const flags = listDriftFlags();
  const tribunals = listTribunalCases();

  return {
    summary: {
      totalFlags: flags.length,
      openTribunals: tribunals.filter(
        (x) => x.status === "OPEN" || x.status === "UNDER_REVIEW",
      ).length,
      upheldTribunals: tribunals.filter((x) => x.status === "UPHELD").length,
      overturnedTribunals: tribunals.filter((x) => x.status === "OVERTURNED").length,
    },
    flags,
    tribunals,
  };
}