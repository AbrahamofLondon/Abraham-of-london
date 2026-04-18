export const CONSTITUTIONAL_THREAD_KEY = "aol_constitutional_thread_v1";

export type ConstitutionalThread = {
  source: "constitutional-diagnostic";
  createdAt: string;
  route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
  routeHref: string;
  confidence: number;
  posture: string;
  readinessTier: string;
  authorityType: string;
  domainScores: {
    coherence: number;
    authority: number;
    trust: number;
    pressure: number;
    friction: number;
    seriousness: number;
    governance: number;
  };
  failureModes: string[];
  recommendedInterventions: string[];
  rationale: string[];
  summary: {
    title: string;
    narrative: string;
    whatThisStageTests: string;
  };
  bridge: {
    teamAssessment: {
      prompts: string[];
      hypotheses: string[];
    };
    enterpriseAssessment: {
      watchpoints: string[];
      rationale: string;
    };
    strategyRoom: {
      summary: string;
      route: string;
      escalationAllowed: boolean;
    };
  };
};

export function saveConstitutionalThread(thread: ConstitutionalThread): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CONSTITUTIONAL_THREAD_KEY, JSON.stringify(thread));
  } catch {
    // ignore unavailable session storage
  }
}

export function readConstitutionalThread(): ConstitutionalThread | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONSTITUTIONAL_THREAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConstitutionalThread;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
