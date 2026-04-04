/* store/useOGRStore.ts — OGR GLOBAL STATE (ULTRA-HARDENED, MANIFEST-ALIGNED) */
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import {
  calculateDerived,
  sanitizeResonance,
  sanitizeFriction,
  sanitizeRevenue,
  roundTo,
  type OGRMetrics,
  type OGRComputed,
} from "@/lib/ogr/manifest-engine";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type BaselineSnapshot = OGRMetrics & OGRComputed;

type DeltaSnapshot = {
  resonanceScore: number;
  marketFriction: number;
  targetRevenue: number;
  integrationTax: number;
  velocityMultiplier: number;
  resonanceAlpha: number;
  sovereignCertainty: number;
};

type SovereignAuthResponse = {
  ok?: boolean;
  error?: string;
};

type SovereignReportResponse = {
  status?: string;
  reportId?: string;
  error?: string;
};

type PersistedOGRState = {
  resonanceScore: number;
  marketFriction: number;
  targetRevenue: number;
  selectedBriefIds: string[];
  isRegistryOpen: boolean;
  baseline: BaselineSnapshot | null;
  isAuthenticated: boolean;
};

interface OGRState extends OGRMetrics {
  selectedBriefIds: string[];
  isRegistryOpen: boolean;
  isAuthenticated: boolean;

  computed: OGRComputed;
  baseline: BaselineSnapshot | null;

  /* Selection */
  toggleBrief: (id: string) => void;
  clearSelection: () => void;
  setRegistryOpen: (open: boolean) => void;

  /* Metrics */
  setResonance: (val: number) => void;
  setFriction: (val: number) => void;
  setRevenue: (val: number) => void;
  setMetrics: (metrics: Partial<OGRMetrics>) => void;
  resetMetrics: () => void;

  /* Auth */
  authenticate: (key: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;

  /* Reporting */
  commitReport: () => Promise<{ success: boolean; id?: string; error?: string }>;

  /* Baseline */
  setBaseline: () => void;
  clearBaseline: () => void;
  getDeltaFromBaseline: () => DeltaSnapshot | null;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const STORE_NAME = "ogr-sovereign-storage";
const STORE_VERSION = 1;

const INITIAL_METRICS: OGRMetrics = {
  resonanceScore: 92.5,
  marketFriction: 65.0,
  targetRevenue: 100,
};

const INITIAL_COMPUTED: OGRComputed = calculateDerived(INITIAL_METRICS);

/* -------------------------------------------------------------------------- */
/* PURE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function toSafeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function uniqueNonEmptyStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const next = toSafeString(value).trim();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }

  return out;
}

function buildMetrics(
  current: OGRMetrics,
  patch: Partial<OGRMetrics>
): OGRMetrics {
  return {
    resonanceScore:
      patch.resonanceScore !== undefined
        ? sanitizeResonance(patch.resonanceScore)
        : current.resonanceScore,
    marketFriction:
      patch.marketFriction !== undefined
        ? sanitizeFriction(patch.marketFriction)
        : current.marketFriction,
    targetRevenue:
      patch.targetRevenue !== undefined
        ? sanitizeRevenue(patch.targetRevenue)
        : current.targetRevenue,
  };
}

function buildComputed(metrics: OGRMetrics): OGRComputed {
  return calculateDerived(metrics);
}

function toDelta(current: OGRState, baseline: BaselineSnapshot): DeltaSnapshot {
  return {
    resonanceScore: roundTo(
      current.resonanceScore - baseline.resonanceScore,
      4
    ),
    marketFriction: roundTo(
      current.marketFriction - baseline.marketFriction,
      4
    ),
    targetRevenue: roundTo(
      current.targetRevenue - baseline.targetRevenue,
      4
    ),
    integrationTax: roundTo(
      current.computed.integrationTax - baseline.integrationTax,
      4
    ),
    velocityMultiplier: roundTo(
      current.computed.velocityMultiplier - baseline.velocityMultiplier,
      4
    ),
    resonanceAlpha: roundTo(
      current.computed.resonanceAlpha - baseline.resonanceAlpha,
      4
    ),
    sovereignCertainty: roundTo(
      current.computed.sovereignCertainty - baseline.sovereignCertainty,
      4
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* STORE                                                                      */
/* -------------------------------------------------------------------------- */

export const useOGRStore = create<OGRState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        /* ------------------------------------------------------------------ */
        /* INITIAL STATE                                                      */
        /* ------------------------------------------------------------------ */
        resonanceScore: INITIAL_METRICS.resonanceScore,
        marketFriction: INITIAL_METRICS.marketFriction,
        targetRevenue: INITIAL_METRICS.targetRevenue,

        selectedBriefIds: [],
        isRegistryOpen: false,
        isAuthenticated: false,

        computed: INITIAL_COMPUTED,
        baseline: null,

        /* ------------------------------------------------------------------ */
        /* SELECTION ACTIONS                                                  */
        /* ------------------------------------------------------------------ */
        toggleBrief: (id) =>
          set(
            (state) => ({
              selectedBriefIds: state.selectedBriefIds.includes(id)
                ? state.selectedBriefIds.filter((bid) => bid !== id)
                : [...state.selectedBriefIds, id],
            }),
            false,
            "ogr/toggleBrief"
          ),

        clearSelection: () =>
          set({ selectedBriefIds: [] }, false, "ogr/clearSelection"),

        setRegistryOpen: (open) =>
          set(
            { isRegistryOpen: Boolean(open) },
            false,
            "ogr/setRegistryOpen"
          ),

        /* ------------------------------------------------------------------ */
        /* METRIC ACTIONS                                                     */
        /* ------------------------------------------------------------------ */
        setResonance: (val) =>
          set(
            (state) => {
              const metrics = buildMetrics(
                {
                  resonanceScore: state.resonanceScore,
                  marketFriction: state.marketFriction,
                  targetRevenue: state.targetRevenue,
                },
                { resonanceScore: val }
              );

              return {
                resonanceScore: metrics.resonanceScore,
                computed: buildComputed(metrics),
              };
            },
            false,
            "ogr/setResonance"
          ),

        setFriction: (val) =>
          set(
            (state) => {
              const metrics = buildMetrics(
                {
                  resonanceScore: state.resonanceScore,
                  marketFriction: state.marketFriction,
                  targetRevenue: state.targetRevenue,
                },
                { marketFriction: val }
              );

              return {
                marketFriction: metrics.marketFriction,
                computed: buildComputed(metrics),
              };
            },
            false,
            "ogr/setFriction"
          ),

        setRevenue: (val) =>
          set(
            (state) => {
              const metrics = buildMetrics(
                {
                  resonanceScore: state.resonanceScore,
                  marketFriction: state.marketFriction,
                  targetRevenue: state.targetRevenue,
                },
                { targetRevenue: val }
              );

              return {
                targetRevenue: metrics.targetRevenue,
                computed: buildComputed(metrics),
              };
            },
            false,
            "ogr/setRevenue"
          ),

        setMetrics: (patch) =>
          set(
            (state) => {
              const metrics = buildMetrics(
                {
                  resonanceScore: state.resonanceScore,
                  marketFriction: state.marketFriction,
                  targetRevenue: state.targetRevenue,
                },
                patch
              );

              return {
                ...metrics,
                computed: buildComputed(metrics),
              };
            },
            false,
            "ogr/setMetrics"
          ),

        resetMetrics: () =>
          set(
            {
              resonanceScore: INITIAL_METRICS.resonanceScore,
              marketFriction: INITIAL_METRICS.marketFriction,
              targetRevenue: INITIAL_METRICS.targetRevenue,
              computed: INITIAL_COMPUTED,
            },
            false,
            "ogr/resetMetrics"
          ),

        /* ------------------------------------------------------------------ */
        /* AUTH ACTIONS                                                       */
        /* ------------------------------------------------------------------ */
        setAuthenticated: (value) =>
          set(
            { isAuthenticated: Boolean(value) },
            false,
            "ogr/setAuthenticated"
          ),

        authenticate: async (key) => {
          const trimmedKey = toSafeString(key).trim();

          if (!trimmedKey) {
            set({ isAuthenticated: false }, false, "ogr/authenticateEmpty");
            return false;
          }

          try {
            const response = await fetch("/api/sovereign/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ key: trimmedKey }),
            });

            if (!response.ok) {
              set({ isAuthenticated: false }, false, "ogr/authenticateFail");
              return false;
            }

            const data = (await response.json()) as SovereignAuthResponse;
            const isValid = Boolean(data?.ok);

            set(
              { isAuthenticated: isValid },
              false,
              isValid ? "ogr/authenticateSuccess" : "ogr/authenticateReject"
            );

            return isValid;
          } catch {
            set({ isAuthenticated: false }, false, "ogr/authenticateError");
            return false;
          }
        },

        logout: async () => {
          try {
            await fetch("/api/sovereign/logout", {
              method: "POST",
              credentials: "same-origin",
            });
          } catch {
            // Intentionally fail-open on network layer.
          }

          set({ isAuthenticated: false }, false, "ogr/logout");
        },

        /* ------------------------------------------------------------------ */
        /* REPORTING                                                          */
        /* ------------------------------------------------------------------ */
        commitReport: async () => {
          const state = get();

          try {
            const response = await fetch("/api/sovereign/report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({
                metrics: {
                  resonanceScore: state.resonanceScore,
                  marketFriction: state.marketFriction,
                  targetRevenue: state.targetRevenue,
                },
                selectedBriefs: state.selectedBriefIds,
                timestamp: new Date().toISOString(),
              }),
            });

            if (!response.ok) {
              return {
                success: false,
                error: `REPORT_HTTP_${response.status}`,
              };
            }

            const data = (await response.json()) as SovereignReportResponse;

            return {
              success: data?.status === "SUCCESS",
              id:
                typeof data?.reportId === "string" ? data.reportId : undefined,
              error:
                data?.status === "SUCCESS"
                  ? undefined
                  : toSafeString(data?.error) || "REPORT_REJECTED",
            };
          } catch {
            return { success: false, error: "REPORT_NETWORK_FAILURE" };
          }
        },

        /* ------------------------------------------------------------------ */
        /* BASELINE                                                           */
        /* ------------------------------------------------------------------ */
        setBaseline: () =>
          set(
            (state) => ({
              baseline: {
                resonanceScore: state.resonanceScore,
                marketFriction: state.marketFriction,
                targetRevenue: state.targetRevenue,
                ...state.computed,
              },
            }),
            false,
            "ogr/setBaseline"
          ),

        clearBaseline: () =>
          set({ baseline: null }, false, "ogr/clearBaseline"),

        getDeltaFromBaseline: () => {
          const state = get();
          if (!state.baseline) return null;
          return toDelta(state, state.baseline);
        },
      })),
      {
        name: STORE_NAME,
        version: STORE_VERSION,

        partialize: (state): PersistedOGRState => ({
          resonanceScore: state.resonanceScore,
          marketFriction: state.marketFriction,
          targetRevenue: state.targetRevenue,
          selectedBriefIds: uniqueNonEmptyStrings(state.selectedBriefIds),
          isRegistryOpen: state.isRegistryOpen,
          baseline: state.baseline,
          isAuthenticated: state.isAuthenticated,
        }),

        migrate: (persistedState, version) => {
          const raw = (persistedState ?? {}) as Partial<PersistedOGRState>;

          if (version < STORE_VERSION) {
            const metrics: OGRMetrics = buildMetrics(INITIAL_METRICS, {
              resonanceScore: raw.resonanceScore,
              marketFriction: raw.marketFriction,
              targetRevenue: raw.targetRevenue,
            });

            return {
              ...raw,
              resonanceScore: metrics.resonanceScore,
              marketFriction: metrics.marketFriction,
              targetRevenue: metrics.targetRevenue,
              selectedBriefIds: uniqueNonEmptyStrings(raw.selectedBriefIds ?? []),
              isRegistryOpen: Boolean(raw.isRegistryOpen),
              isAuthenticated: Boolean(raw.isAuthenticated),
              baseline: raw.baseline ?? null,
            };
          }

          return raw as PersistedOGRState;
        },
      }
    ),
    { name: "OGR_Intelligence_Engine" }
  )
);