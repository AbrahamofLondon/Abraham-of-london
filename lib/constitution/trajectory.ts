export type Trajectory =
  | "ASCENDING"
  | "STAGNANT"
  | "FRAGILE"
  | "DETERIORATING";

export function inferTrajectory(
  clarity: number,
  readiness: number,
  failureModes: string[],
): Trajectory {
  if (readiness > 70 && failureModes.length === 0) return "ASCENDING";

  if (readiness > 50 && failureModes.length <= 1) return "STAGNANT";

  if (readiness < 50 && failureModes.length >= 2) return "FRAGILE";

  if (readiness < 40 && failureModes.length >= 3) return "DETERIORATING";

  return "STAGNANT";
}