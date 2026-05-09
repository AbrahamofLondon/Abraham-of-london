import * as React from "react";

import type { CounselCase } from "@/lib/product/counsel-room-contract";

type TimelineStatus =
  | "REQUESTED"
  | "EVIDENCE_REVIEW_REQUIRED"
  | "ACCEPTED_FOR_REVIEW"
  | "IN_COUNSEL_REVIEW"
  | "COUNSEL_RESPONSE_READY"
  | "CLOSED"
  | "DECLINED";

type TimelineItem = {
  status: TimelineStatus;
  happened: string;
  waitingFor: string;
  userCanDo: string;
  operatorCanDo: string;
  active: boolean;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function normalizeStatus(status: CounselCase["status"]): TimelineStatus {
  switch (status) {
    case "MORE_EVIDENCE_REQUIRED":
      return "EVIDENCE_REVIEW_REQUIRED";
    case "DECLINED_NOT_WARRANTED":
      return "DECLINED";
    default:
      return status;
  }
}

function buildTimeline(status: TimelineStatus): TimelineItem[] {
  const ordered: TimelineItem[] = [
    {
      status: "REQUESTED",
      happened: "The counsel case was created from the governed evidence package.",
      waitingFor: "Operator triage.",
      userCanDo: "Monitor status and keep evidence current.",
      operatorCanDo: "Validate the intake and route the case.",
      active: false,
    },
    {
      status: "EVIDENCE_REVIEW_REQUIRED",
      happened: "The case is open but cannot proceed until evidence gaps are reviewed.",
      waitingFor: "Additional or clarified evidence.",
      userCanDo: "Provide missing evidence or answer the checkpoint.",
      operatorCanDo: "Specify what evidence is still required.",
      active: false,
    },
    {
      status: "ACCEPTED_FOR_REVIEW",
      happened: "The case has cleared triage and entered the counsel queue.",
      waitingFor: "Counsel allocation.",
      userCanDo: "Hold position unless new evidence materially changes the case.",
      operatorCanDo: "Assign the review question and reviewer.",
      active: false,
    },
    {
      status: "IN_COUNSEL_REVIEW",
      happened: "Counsel is reviewing the evidence package and escalation question.",
      waitingFor: "Counsel response.",
      userCanDo: "Add only material new evidence.",
      operatorCanDo: "Maintain chain of evidence and capture the recommendation.",
      active: false,
    },
    {
      status: "COUNSEL_RESPONSE_READY",
      happened: "A counsel response is ready for governed release.",
      waitingFor: "Client acknowledgement or closure.",
      userCanDo: "Review the response and act on the required move.",
      operatorCanDo: "Release the response and monitor follow-through.",
      active: false,
    },
    {
      status: "CLOSED",
      happened: "The counsel case has been concluded.",
      waitingFor: "No immediate action unless a new escalation is opened.",
      userCanDo: "Maintain the implemented decision state.",
      operatorCanDo: "Archive the case and monitor downstream outcomes.",
      active: false,
    },
    {
      status: "DECLINED",
      happened: "Counsel review was declined as not yet warranted.",
      waitingFor: "Additional evidence or a materially changed condition.",
      userCanDo: "Return with stronger evidence if the condition persists.",
      operatorCanDo: "Record why counsel was not warranted.",
      active: false,
    },
  ];

  let reached = true;
  for (const item of ordered) {
    item.active = item.status === status;
    if (item.status === status) {
      reached = false;
    }
    if (reached) {
      item.active = true;
    }
  }
  return ordered;
}

export function CounselCaseTimeline({ counselCase }: { counselCase: CounselCase }) {
  const normalized = normalizeStatus(counselCase.status);
  const items = buildTimeline(normalized);

  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
        Counsel Status
      </p>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article
            key={item.status}
            style={{
              borderLeft: item.status === normalized
                ? "2px solid rgba(201,169,110,0.72)"
                : "2px solid rgba(255,255,255,0.10)",
              paddingLeft: "1rem",
              opacity: item.active ? 1 : 0.45,
            }}
          >
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: item.status === normalized ? "rgba(201,169,110,0.92)" : "rgba(255,255,255,0.46)" }}>
              {item.status}
            </p>
            <p className="mt-2 text-sm text-white/70">{item.happened}</p>
            <p className="mt-2 text-sm text-white/55">Waiting for: {item.waitingFor}</p>
            <p className="mt-2 text-sm text-white/55">User can do: {item.userCanDo}</p>
            <p className="mt-1 text-sm text-white/45">Counsel/operator can do: {item.operatorCanDo}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CounselCaseTimeline;
