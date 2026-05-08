import type { StrategyExecutionRecord } from "@/lib/strategy-room/execution-record";

export type VerificationCheckpoint =
  | "DAY_14"
  | "DAY_30"
  | "DAY_60"
  | "MONTHLY_RETAINER";

export type CommitmentVerificationState = {
  commitmentId: string;
  label: string;
  dueAt?: string;
  checkpoint: VerificationCheckpoint;
  status:
    | "NOT_DUE"
    | "DUE"
    | "OVERDUE"
    | "VERIFIED_EXECUTED"
    | "VERIFIED_BLOCKED"
    | "UNVERIFIED";
  prompt: string;
};

type Status = CommitmentVerificationState["status"];

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function statusFromDates(input: {
  dueAt: Date;
  now: Date;
  lastVerifiedAt?: Date | null;
  blocked?: boolean;
}): Status {
  if (input.lastVerifiedAt) {
    return input.blocked ? "VERIFIED_BLOCKED" : "VERIFIED_EXECUTED";
  }
  if (input.now.getTime() > input.dueAt.getTime()) {
    return "OVERDUE";
  }
  if (input.now.toDateString() === input.dueAt.toDateString()) {
    return "DUE";
  }
  return "NOT_DUE";
}

export function buildCommitmentVerificationStates(input: {
  executionRecord?: StrategyExecutionRecord | null;
  latestDecisionStatus?: string | null;
  latestDecisionUpdatedAt?: Date | string | null;
  now?: Date | string;
}): CommitmentVerificationState[] {
  const createdAt = toDate(input.executionRecord?.createdAt);
  const now = toDate(input.now ?? new Date());
  if (!createdAt || !now || !input.executionRecord) return [];

  const verifiedAt = toDate(input.latestDecisionUpdatedAt);
  const blocked = (input.latestDecisionStatus || "").toLowerCase() === "blocked";
  const executed = (input.latestDecisionStatus || "").toLowerCase() === "executed";
  const hasVerification = executed || blocked;

  const checkpoints: Array<{ checkpoint: VerificationCheckpoint; dueAt: Date; label: string }> = [
    { checkpoint: "DAY_14", dueAt: addDays(createdAt, 14), label: "14-day verification" },
    { checkpoint: "DAY_30", dueAt: addDays(createdAt, 30), label: "30-day verification" },
    { checkpoint: "DAY_60", dueAt: addDays(createdAt, 60), label: "60-day verification" },
    { checkpoint: "MONTHLY_RETAINER", dueAt: addDays(createdAt, 30), label: "Monthly oversight verification" },
  ];

  return checkpoints.map((item) => {
    const status = statusFromDates({
      dueAt: item.dueAt,
      now,
      lastVerifiedAt: hasVerification ? verifiedAt : null,
      blocked,
    });
    return {
      commitmentId: input.executionRecord?.id || "unknown_commitment",
      label: item.label,
      dueAt: item.dueAt.toISOString(),
      checkpoint: item.checkpoint,
      status: hasVerification && !verifiedAt ? "UNVERIFIED" : status,
      prompt:
        status === "VERIFIED_EXECUTED"
          ? "Execution verified. Continue monitoring whether the structural shift holds."
          : status === "VERIFIED_BLOCKED"
            ? "Execution was blocked. Record the blocker and confirm whether escalation is required."
            : status === "OVERDUE"
              ? "Verification is overdue. Confirm whether the committed action happened, stalled, or failed."
              : status === "DUE"
                ? "Verification is due now. Record whether the action was executed or blocked."
                : "Verification checkpoint recorded. No action is required yet.",
    };
  });
}
