import crypto from "crypto";

function safe(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function buildOperatorKey(input: {
  email?: string | null;
  organisation?: string | null;
  name?: string | null;
}): string {
  const base = [safe(input.email), safe(input.organisation), safe(input.name)]
    .filter(Boolean)
    .join("|");

  return hash(base || "unknown-operator");
}

export function buildCaseKey(input: {
  operatorKey: string;
  problemStatement?: string | null;
  organisation?: string | null;
}): string {
  const base = [
    input.operatorKey,
    safe(input.organisation),
    safe(input.problemStatement),
  ]
    .filter(Boolean)
    .join("|");

  return hash(base || "unknown-case");
}