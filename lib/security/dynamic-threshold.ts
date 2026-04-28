type ThresholdOptions = {
  minDrift?: number;
  maxDrift?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSecretSalt(): string {
  return (
    process.env.DYNAMIC_THRESHOLD_SALT ||
    process.env.SECURE_CLIENT_STATE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "development-dynamic-threshold-salt"
  );
}

function hashFraction(input: string): number {
  const crypto = require("crypto") as typeof import("crypto");
  const digest = crypto
    .createHash("sha256")
    .update(`${input}:${getSecretSalt()}`)
    .digest("hex")
    .slice(0, 8);

  return parseInt(digest, 16) / 0xffffffff;
}

export function getDynamicThreshold(
  base: number,
  context: string,
  options?: ThresholdOptions,
): number {
  const minDrift = options?.minDrift ?? -5;
  const maxDrift = options?.maxDrift ?? 5;
  const drift = minDrift + hashFraction(context) * (maxDrift - minDrift);
  return clamp(base + drift, 0, 100);
}

export function getDynamicWeightMultiplier(
  base: number,
  context: string,
  options?: { driftPercent?: number },
): number {
  const driftPercent = options?.driftPercent ?? 0.06;
  const fraction = hashFraction(`weight:${context}`);
  const drift = (fraction * 2 - 1) * driftPercent;
  return Math.max(0.1, base * (1 + drift));
}
