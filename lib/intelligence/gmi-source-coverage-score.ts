import {
  getSourceRowsForReport,
  type GmiSourceAppendixRow,
} from "./gmi-source-appendix-registry";

export type GmiSourceCoverageScore = {
  totalRows: number;
  verifiedRows: number;
  pendingRows: number;
  blockerRows: number;
  coverageScore: number;
  releaseSafe: boolean;
};

function isVerified(row: GmiSourceAppendixRow): boolean {
  return row.status === "VERIFIED" || row.status === "CARRIED_FORWARD";
}

function isPending(row: GmiSourceAppendixRow): boolean {
  return row.status === "SOURCE_PENDING" || row.status === "METHOD_NOTE_REQUIRED";
}

export function calculateGmiSourceCoverageScore(
  reportId: string,
  rows: readonly GmiSourceAppendixRow[] = getSourceRowsForReport(reportId),
): GmiSourceCoverageScore {
  const totalRows = rows.length;
  const verifiedRows = rows.filter(isVerified).length;
  const pendingRows = rows.filter(isPending).length;
  const blockerRows = rows.filter((row) => row.releaseBlocker && isPending(row)).length;
  const coverageScore =
    totalRows === 0 ? 0 : Math.round((verifiedRows / totalRows) * 1000) / 10;

  return {
    totalRows,
    verifiedRows,
    pendingRows,
    blockerRows,
    coverageScore,
    releaseSafe: blockerRows === 0 && coverageScore >= 80,
  };
}

export function getCoverageWarning(score: GmiSourceCoverageScore): string | null {
  if (!score.releaseSafe) return "Source coverage is not release-safe.";
  if (score.coverageScore < 90) return "Source coverage is below paid-edition warning threshold.";
  return null;
}
