// lib/assets/pdf-canonical.ts

export type CanonicalDecisionKind = "canonical" | "alias" | "duplicate" | "conflict";

export type PdfAuthority = "canonical" | "generated" | "legacy" | "draft";

export type PdfAssetCandidate = {
  slug: string;
  path: string;
  hash: string;
  size: number;
  mtimeMs?: number;
  authority?: PdfAuthority;
  explicitlyAuthoritative?: boolean;
  generated?: boolean;
  static?: boolean;
};

export type CanonicalDecision = {
  slug: string;
  canonicalPath: string;
  decision: CanonicalDecisionKind;
  reason: string;
  sourcePaths: string[];
  resolved: boolean;
  aliasPaths?: string[];
  materialisationRequired?: boolean;
  confidence?: "high" | "medium" | "low";
};

type Winner = {
  candidate: PdfAssetCandidate;
  reason: string;
  confidence: CanonicalDecision["confidence"];
};

export function normalizePdfPath(input: string): string {
  const normalized = String(input || "").replace(/\\/g, "/").replace(/\/{2,}/g, "/").trim();
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function canonicalDownloadsPath(slug: string): string {
  return `/assets/downloads/${slug}.pdf`;
}

export function isCanonicalDownloadsPath(input: string, slug: string): boolean {
  return normalizePdfPath(input) === canonicalDownloadsPath(slug);
}

export function isGeneratedCandidate(candidate: PdfAssetCandidate): boolean {
  if (typeof candidate.generated === "boolean") return candidate.generated;
  return candidate.authority === "generated" || normalizePdfPath(candidate.path).includes("/content-downloads/");
}

export function isStaticCandidate(candidate: PdfAssetCandidate): boolean {
  if (typeof candidate.static === "boolean") return candidate.static;
  return !isGeneratedCandidate(candidate);
}

export function isLegacyCandidate(candidate: PdfAssetCandidate): boolean {
  return candidate.authority === "legacy";
}

export function isExplicitlyAuthoritative(candidate: PdfAssetCandidate): boolean {
  return candidate.explicitlyAuthoritative === true;
}

export function sourcePathsForGroup(group: PdfAssetCandidate[]): string[] {
  return group.map((candidate) => normalizePdfPath(candidate.path));
}

export function allHashesIdentical(group: PdfAssetCandidate[]): boolean {
  if (group.length <= 1) return true;
  const firstHash = group[0]?.hash;
  return Boolean(firstHash) && group.every((candidate) => candidate.hash === firstHash);
}

export function existingCanonicalCandidate(group: PdfAssetCandidate[], slug: string): PdfAssetCandidate | undefined {
  return group.find((candidate) => isCanonicalDownloadsPath(candidate.path, slug));
}

export function canonicalTargetExists(group: PdfAssetCandidate[], slug: string): boolean {
  return Boolean(existingCanonicalCandidate(group, slug));
}

function sortNewestFirst(group: PdfAssetCandidate[]): PdfAssetCandidate[] {
  return [...group].sort((a, b) => (b.mtimeMs ?? 0) - (a.mtimeMs ?? 0));
}

function bestByPathThenFreshness(group: PdfAssetCandidate[]): PdfAssetCandidate | undefined {
  return [...group].sort((a, b) => {
    const pathDelta = normalizePdfPath(a.path).localeCompare(normalizePdfPath(b.path));
    if (pathDelta !== 0) return pathDelta;
    return (b.mtimeMs ?? 0) - (a.mtimeMs ?? 0);
  })[0];
}

export function bestStaticCandidate(group: PdfAssetCandidate[], slug: string): PdfAssetCandidate | undefined {
  const statics = group.filter(isStaticCandidate);
  return (
    existingCanonicalCandidate(statics, slug) ||
    sortNewestFirst(statics.filter(isExplicitlyAuthoritative))[0] ||
    sortNewestFirst(statics)[0]
  );
}

export function bestGeneratedCandidate(group: PdfAssetCandidate[], slug: string): PdfAssetCandidate | undefined {
  const generated = group.filter(isGeneratedCandidate);
  return (
    existingCanonicalCandidate(generated, slug) ||
    sortNewestFirst(generated.filter(isExplicitlyAuthoritative))[0] ||
    sortNewestFirst(generated)[0]
  );
}

export function bestAliasSourceCandidate(group: PdfAssetCandidate[], slug: string): PdfAssetCandidate | undefined {
  return (
    existingCanonicalCandidate(group, slug) ||
    bestStaticCandidate(group, slug) ||
    bestGeneratedCandidate(group, slug) ||
    sortNewestFirst(group.filter(isLegacyCandidate))[0] ||
    bestByPathThenFreshness(group)
  );
}

export function materialisationRequiredFor(candidate: PdfAssetCandidate | undefined, slug: string): boolean {
  if (!candidate) return false;
  return !isCanonicalDownloadsPath(candidate.path, slug);
}

function decisionFromWinner(params: {
  slug: string;
  group: PdfAssetCandidate[];
  winner: PdfAssetCandidate;
  reason: string;
  confidence: CanonicalDecision["confidence"];
  decision?: CanonicalDecisionKind;
}): CanonicalDecision {
  const sourcePaths = sourcePathsForGroup(params.group);
  const winnerPath = normalizePdfPath(params.winner.path);
  const canonicalPath = canonicalDownloadsPath(params.slug);
  const materialisationRequired = materialisationRequiredFor(params.winner, params.slug);
  const reason = materialisationRequired
    ? `${params.reason} Canonical endpoint ${canonicalPath} must be materialised from ${winnerPath}; physical canonical binary is not represented in this candidate group.`
    : `${params.reason} Canonical endpoint already exists at ${canonicalPath}.`;

  return {
    slug: params.slug,
    canonicalPath,
    decision: params.decision ?? "canonical",
    reason,
    sourcePaths,
    resolved: true,
    aliasPaths: sourcePaths.filter((sourcePath) => sourcePath !== winnerPath),
    materialisationRequired,
    confidence: params.confidence,
  };
}

export function resolveStaticVsGenerated(group: PdfAssetCandidate[], slug: string): Winner | null {
  const staticCandidate = bestStaticCandidate(group, slug);
  const generatedCandidate = bestGeneratedCandidate(group, slug);

  if (!staticCandidate || !generatedCandidate) return null;

  const generatedIsNewer = (generatedCandidate.mtimeMs ?? 0) > (staticCandidate.mtimeMs ?? 0);
  if (generatedIsNewer && isExplicitlyAuthoritative(generatedCandidate)) {
    return {
      candidate: generatedCandidate,
      reason: "Generated source wins because it is newer than the static source and explicitly authoritative.",
      confidence: "high",
    };
  }

  return {
    candidate: staticCandidate,
    reason: "Static source wins by policy because generated source is not both newer and explicitly authoritative.",
    confidence: "high",
  };
}

export function resolveSingleExplicitAuthority(group: PdfAssetCandidate[]): Winner | null {
  const authoritative = group.filter(isExplicitlyAuthoritative);
  if (authoritative.length !== 1) return null;

  return {
    candidate: authoritative[0]!,
    reason: "Single explicitly authoritative source wins over non-authoritative variants.",
    confidence: "high",
  };
}

export function decideCanonical(group: PdfAssetCandidate[]): CanonicalDecision {
  if (group.length === 0) {
    return {
      slug: "unknown",
      canonicalPath: "",
      decision: "conflict",
      reason: "Empty asset group provided; no metadata exists to resolve canonical authority.",
      sourcePaths: [],
      resolved: false,
      aliasPaths: [],
      materialisationRequired: false,
      confidence: "low",
    };
  }

  const slug = group[0]!.slug;
  const canonicalPath = canonicalDownloadsPath(slug);
  const sourcePaths = sourcePathsForGroup(group);

  if (group.length === 1) {
    return decisionFromWinner({
      slug,
      group,
      winner: group[0]!,
      decision: "canonical",
      reason: "Only one file exists for this slug.",
      confidence: "high",
    });
  }

  if (allHashesIdentical(group)) {
    const winner = bestAliasSourceCandidate(group, slug);
    if (!winner) {
      return {
        slug,
        canonicalPath,
        decision: "conflict",
        reason: "Identical hash rule matched but no candidate was available for alias source selection.",
        sourcePaths,
        resolved: false,
        aliasPaths: [],
        materialisationRequired: false,
        confidence: "low",
      };
    }

    return decisionFromWinner({
      slug,
      group,
      winner,
      decision: "alias",
      reason: "All files are byte-identical; /assets/downloads/{slug}.pdf is the preferred canonical endpoint and all other paths are aliases.",
      confidence: "high",
    });
  }

  const staticVsGenerated = resolveStaticVsGenerated(group, slug);
  if (staticVsGenerated) {
    return decisionFromWinner({
      slug,
      group,
      winner: staticVsGenerated.candidate,
      decision: "canonical",
      reason: staticVsGenerated.reason,
      confidence: staticVsGenerated.confidence,
    });
  }

  const explicitAuthority = resolveSingleExplicitAuthority(group);
  if (explicitAuthority) {
    return decisionFromWinner({
      slug,
      group,
      winner: explicitAuthority.candidate,
      decision: "canonical",
      reason: explicitAuthority.reason,
      confidence: explicitAuthority.confidence,
    });
  }

  const existingCanonical = existingCanonicalCandidate(group, slug);
  if (existingCanonical) {
    return decisionFromWinner({
      slug,
      group,
      winner: existingCanonical,
      decision: "canonical",
      reason: "Existing /assets/downloads/{slug}.pdf wins because no authority or recency rule proves it inferior.",
      confidence: "medium",
    });
  }

  return {
    slug,
    canonicalPath,
    decision: "conflict",
    reason: "Divergent hashes remain unresolved: no static/generated rule, single explicit authority, or existing canonical path can decide this group.",
    sourcePaths,
    resolved: false,
    aliasPaths: [],
    materialisationRequired: true,
    confidence: "low",
  };
}

export function decideCanonicals(groups: PdfAssetCandidate[][]): CanonicalDecision[] {
  return groups.map(decideCanonical);
}
