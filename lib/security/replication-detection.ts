export type ReplicationTelemetry = {
  ip?: string | null;
  sessionKey?: string | null;
  operatorKey?: string | null;
  userAgent?: string | null;
  answeredCount?: number;
};

export type ReplicationAssessment = {
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  throttleSuggested: boolean;
  responseDetail: "full" | "reduced";
};

type BucketEntry = {
  count: number;
  startedAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const store = globalThis as typeof globalThis & {
  __aolReplicationStore?: Map<string, BucketEntry>;
};

function getBucketStore(): Map<string, BucketEntry> {
  if (!store.__aolReplicationStore) {
    store.__aolReplicationStore = new Map();
  }
  return store.__aolReplicationStore;
}

function touchBucket(key: string): BucketEntry {
  const now = Date.now();
  const buckets = getBucketStore();
  const current = buckets.get(key);

  if (!current || now - current.startedAt > WINDOW_MS) {
    const next = { count: 1, startedAt: now };
    buckets.set(key, next);
    return next;
  }

  current.count += 1;
  buckets.set(key, current);
  return current;
}

function normalizeKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export function assessReplicationRisk(
  telemetry: ReplicationTelemetry,
): ReplicationAssessment {
  const reasons: string[] = [];
  const identity =
    normalizeKey(telemetry.sessionKey) ||
    normalizeKey(telemetry.operatorKey) ||
    normalizeKey(telemetry.ip) ||
    "anonymous";

  const bucket = touchBucket(identity);

  if (bucket.count >= 5) {
    reasons.push("High-frequency probing pattern detected.");
  }

  const ua = normalizeKey(telemetry.userAgent);
  if (ua && /(python|curl|wget|postman|insomnia|bot)/i.test(ua)) {
    reasons.push("Non-human request agent detected.");
  }

  if ((telemetry.answeredCount ?? 0) >= 9 && bucket.count >= 3) {
    reasons.push("Repeated full-length submissions in short window.");
  }

  if (reasons.length >= 2 || bucket.count >= 7) {
    return {
      riskLevel: "high",
      reasons,
      throttleSuggested: true,
      responseDetail: "reduced",
    };
  }

  if (reasons.length >= 1 || bucket.count >= 4) {
    return {
      riskLevel: "medium",
      reasons,
      throttleSuggested: false,
      responseDetail: "reduced",
    };
  }

  return {
    riskLevel: "low",
    reasons,
    throttleSuggested: false,
    responseDetail: "full",
  };
}
