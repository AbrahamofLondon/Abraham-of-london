/**
 * Prior Assessment Comparison — trajectory, not snapshot.
 *
 * WHY THIS IS IRREPLICABLE:
 * Longitudinal data compounds. After 3 assessments over 6 months,
 * the system can say: "Your identity was collapsing but has stabilised.
 * Your decision integrity peaked and is now declining. The inflection
 * was 3 months ago — what changed?"
 *
 * A competitor starting fresh has zero history. Time invested = advantage locked.
 */

export type PriorAssessment = {
  assessmentType: string;
  completedAt: string;
  scores: Record<string, number>;
  primaryPattern?: string;
  coherenceBand?: string;
};

export type TrajectoryDelta = {
  domain: string;
  previous: number;
  current: number;
  delta: number;
  direction: "improving" | "stable" | "declining" | "collapsed";
  /** How fast the change is happening */
  velocity: "gradual" | "moderate" | "rapid" | "sudden";
  narrative: string;
};

export type InflectionPoint = {
  domain: string;
  detectedAt: string;
  previousDirection: string;
  newDirection: string;
  significance: string;
};

export type PriorComparisonResult = {
  hasPriorData: boolean;
  /** How many prior assessments exist */
  assessmentCount: number;
  /** Time span covered */
  timeSpanDays: number;
  /** Per-domain trajectory */
  trajectories: TrajectoryDelta[];
  /** Inflection points — where direction changed */
  inflectionPoints: InflectionPoint[];
  /** Overall direction */
  overallTrajectory: "improving" | "stable" | "declining" | "volatile";
  /** Pattern progression */
  patternProgression: string;
  /** What to tell the user */
  narrativeSummary: string;
};

export function compareToPrior(
  current: { scores: Record<string, number>; primaryPattern?: string; completedAt: string },
  priors: PriorAssessment[],
): PriorComparisonResult {
  if (priors.length === 0) {
    return {
      hasPriorData: false,
      assessmentCount: 0,
      timeSpanDays: 0,
      trajectories: [],
      inflectionPoints: [],
      overallTrajectory: "stable",
      patternProgression: "",
      narrativeSummary: "This is your first assessment. No prior data for comparison.",
    };
  }

  // Sort priors by date (oldest first)
  const sorted = [...priors].sort((a, b) =>
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );

  const mostRecent = sorted[sorted.length - 1]!;
  const oldest = sorted[0]!;

  const timeSpanDays = Math.round(
    (new Date(current.completedAt).getTime() - new Date(oldest.completedAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  // Compute per-domain trajectories
  const allDomains = new Set([
    ...Object.keys(current.scores),
    ...Object.keys(mostRecent.scores),
  ]);

  const trajectories: TrajectoryDelta[] = [];
  for (const domain of allDomains) {
    const prev = mostRecent.scores[domain];
    const curr = current.scores[domain];
    if (prev === undefined || curr === undefined) continue;

    const delta = curr - prev;
    const absDelta = Math.abs(delta);

    const direction: TrajectoryDelta["direction"] =
      delta > 15 ? "improving"
      : delta > 3 ? "improving"
      : delta < -15 ? "collapsed"
      : delta < -3 ? "declining"
      : "stable";

    const velocity: TrajectoryDelta["velocity"] =
      absDelta >= 25 ? "sudden"
      : absDelta >= 15 ? "rapid"
      : absDelta >= 8 ? "moderate"
      : "gradual";

    const narrative =
      direction === "collapsed"
        ? `${domain} dropped ${absDelta} points since last assessment. This is not drift — this is collapse. What triggered it?`
        : direction === "declining"
        ? `${domain} declined ${absDelta} points. The degradation is ${velocity}. If this rate continues, ${domain} reaches critical in ${Math.round(curr / (absDelta / Math.max(1, timeSpanDays / 30)))} months.`
        : direction === "improving"
        ? `${domain} improved ${absDelta} points. The intervention is working. Sustain the current approach.`
        : `${domain} is stable (±${absDelta} points). No material change since last assessment.`;

    trajectories.push({ domain, previous: prev, current: curr, delta, direction, velocity, narrative });
  }

  // Detect inflection points (direction changed between assessments)
  const inflectionPoints: InflectionPoint[] = [];
  if (sorted.length >= 2) {
    const penultimate = sorted.length >= 2 ? sorted[sorted.length - 2]! : null;
    if (penultimate) {
      for (const domain of allDomains) {
        const older = penultimate.scores[domain] ?? 0;
        const recent = mostRecent.scores[domain] ?? 0;
        const curr = current.scores[domain] ?? 0;

        const prevDelta = recent - older;
        const currDelta = curr - recent;

        // Inflection: direction changed (was improving, now declining, or vice versa)
        if ((prevDelta > 5 && currDelta < -5) || (prevDelta < -5 && currDelta > 5)) {
          inflectionPoints.push({
            domain,
            detectedAt: current.completedAt,
            previousDirection: prevDelta > 0 ? "improving" : "declining",
            newDirection: currDelta > 0 ? "improving" : "declining",
            significance: `${domain} changed direction: was ${prevDelta > 0 ? "improving" : "declining"}, now ${currDelta > 0 ? "improving" : "declining"}. This inflection point occurred between your last two assessments.`,
          });
        }
      }
    }
  }

  // Overall trajectory
  const improving = trajectories.filter((t) => t.direction === "improving").length;
  const declining = trajectories.filter((t) => t.direction === "declining" || t.direction === "collapsed").length;
  const overallTrajectory: PriorComparisonResult["overallTrajectory"] =
    inflectionPoints.length >= 2 ? "volatile"
    : improving > declining * 2 ? "improving"
    : declining > improving * 2 ? "declining"
    : "stable";

  // Pattern progression
  const priorPattern = mostRecent.primaryPattern ?? "unknown";
  const currentPattern = current.primaryPattern ?? "unknown";
  const patternProgression = priorPattern === currentPattern
    ? `Same primary pattern (${currentPattern}) persists across assessments. The root cause has not been addressed.`
    : `Primary pattern shifted from ${priorPattern} to ${currentPattern}. This may indicate a new pressure source or resolution of the prior one.`;

  // Narrative
  const narrativeSummary = overallTrajectory === "declining"
    ? `Your condition is declining across ${declining} domain${declining > 1 ? "s" : ""}. ${inflectionPoints.length > 0 ? `${inflectionPoints.length} inflection point${inflectionPoints.length > 1 ? "s" : ""} detected — direction changed recently.` : "The decline is consistent."} ${patternProgression}`
    : overallTrajectory === "improving"
    ? `Your condition is improving across ${improving} domain${improving > 1 ? "s" : ""}. ${patternProgression} Maintain current trajectory.`
    : overallTrajectory === "volatile"
    ? `Your condition is volatile — direction changes detected in ${inflectionPoints.length} domain${inflectionPoints.length > 1 ? "s" : ""}. This instability itself is a signal. ${patternProgression}`
    : `Your condition is stable. ${patternProgression} No material movement since last assessment.`;

  return {
    hasPriorData: true,
    assessmentCount: sorted.length + 1,
    timeSpanDays,
    trajectories,
    inflectionPoints,
    overallTrajectory,
    patternProgression,
    narrativeSummary,
  };
}
