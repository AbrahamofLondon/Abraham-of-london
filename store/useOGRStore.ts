/* store/useOGRStore.ts — OGR GLOBAL STATE (Consolidated) */
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';

const CONSTANTS = {
  FRICTION_CEILING: 99.99,
  RESONANCE_FLOOR: 0.00,
  RESONANCE_CEILING: 100.00,
  SOVEREIGN_THRESHOLD: 90.00, 
  AUTH_KEY: "OGR-2026-ALPHA",
  PRECISION: 8
} as const;

interface OGRMetrics {
  resonanceScore: number;
  marketFriction: number;
  targetRevenue: number;
}

interface OGRComputed {
  integrationTax: number;
  velocityMultiplier: number;
  resonanceAlpha: number;
  sovereignCertainty: number;
  isAuthorizedToExecute: boolean;
}

interface OGRState extends OGRMetrics {
  // Selection State
  selectedBriefIds: string[];
  isRegistryOpen: boolean;
  
  // Authentication
  isAuthenticated: boolean;
  
  // Computed Values
  computed: OGRComputed;
  
  // Baseline Tracking
  baseline: (OGRMetrics & OGRComputed) | null;
  
  // Selection Actions
  toggleBrief: (id: string) => void;
  clearSelection: () => void;
  setRegistryOpen: (open: boolean) => void;
  
  // Metrics Actions
  setResonance: (val: number) => void;
  setFriction: (val: number) => void;
  setRevenue: (val: number) => void;
  
  // Auth Actions
  authenticate: (key: string) => boolean;
  logout: () => void;
  
  // Report Actions
  commitReport: () => Promise<{ success: boolean; id?: string }>;
  
  // Baseline Actions
  setBaseline: () => void;
  clearBaseline: () => void;
  getDeltaFromBaseline: () => Partial<OGRMetrics & OGRComputed> | null;
}

const calculateDerived = (m: OGRMetrics): OGRComputed => {
  const R = Math.max(CONSTANTS.RESONANCE_FLOOR, Math.min(CONSTANTS.RESONANCE_CEILING, m.resonanceScore));
  const F = Math.max(0, Math.min(CONSTANTS.FRICTION_CEILING, m.marketFriction));
  const Rev = Math.max(0, m.targetRevenue);

  const itax = ((100 - R) * 1.25) + (F * 0.05);
  const vMult = R / (Math.max(0.01, 100 - F));
  const alpha = Rev * ((F / 100) - ((100 - R) / 100));
  const certainty = (R * 0.7) + ((100 - F) * 0.3);

  return {
    integrationTax: Number(itax.toFixed(2)),
    velocityMultiplier: Number(vMult.toFixed(2)),
    resonanceAlpha: Number(alpha.toFixed(2)),
    sovereignCertainty: Number(certainty.toFixed(4)),
    isAuthorizedToExecute: certainty >= CONSTANTS.SOVEREIGN_THRESHOLD
  };
};

export const useOGRStore = create<OGRState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial State
        resonanceScore: 92.5,
        marketFriction: 65.0,
        targetRevenue: 100,
        selectedBriefIds: [],
        isRegistryOpen: false,
        isAuthenticated: false,
        baseline: null,
        computed: calculateDerived({ resonanceScore: 92.5, marketFriction: 65.0, targetRevenue: 100 }),

        // Selection Actions
        toggleBrief: (id) => set((state) => ({
          selectedBriefIds: state.selectedBriefIds.includes(id)
            ? state.selectedBriefIds.filter(bid => bid !== id)
            : [...state.selectedBriefIds, id]
        }), false, "toggleBrief"),

        clearSelection: () => set({ selectedBriefIds: [] }, false, "clearSelection"),

        setRegistryOpen: (open) => set({ isRegistryOpen: open }, false, "setRegistryOpen"),

        // Metrics Actions
        setResonance: (val) => set((state) => {
          const resonanceScore = Number(val.toFixed(CONSTANTS.PRECISION));
          const nextMetrics = { ...state, resonanceScore };
          return { resonanceScore, computed: calculateDerived(nextMetrics) };
        }, false, "setResonance"),

        setFriction: (val) => set((state) => {
          const marketFriction = Number(val.toFixed(CONSTANTS.PRECISION));
          const nextMetrics = { ...state, marketFriction };
          return { marketFriction, computed: calculateDerived(nextMetrics) };
        }, false, "setFriction"),

        setRevenue: (val) => set((state) => {
          const targetRevenue = Number(val.toFixed(CONSTANTS.PRECISION));
          const nextMetrics = { ...state, targetRevenue };
          return { targetRevenue, computed: calculateDerived(nextMetrics) };
        }, false, "setRevenue"),

        // Auth Actions
        authenticate: (key) => {
          const isValid = key === CONSTANTS.AUTH_KEY;
          set({ isAuthenticated: isValid }, false, "authenticate");
          return isValid;
        },

        logout: () => set({ isAuthenticated: false }, false, "logout"),

        // Report Actions
        commitReport: async () => {
          const state = get();
          try {
            const response = await fetch('/api/sovereign/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                metrics: {
                  resonanceScore: state.resonanceScore,
                  marketFriction: state.marketFriction,
                  targetRevenue: state.targetRevenue
                },
                selectedBriefs: state.selectedBriefIds,
                authKey: CONSTANTS.AUTH_KEY,
                timestamp: new Date().toISOString()
              })
            });
            const data = await response.json();
            return { success: data.status === "SUCCESS", id: data.reportId };
          } catch (err) {
            return { success: false };
          }
        },

        // Baseline Actions
        setBaseline: () => set((state) => ({
          baseline: {
            resonanceScore: state.resonanceScore,
            marketFriction: state.marketFriction,
            targetRevenue: state.targetRevenue,
            ...state.computed
          }
        }), false, "setBaseline"),

        clearBaseline: () => set({ baseline: null }, false, "clearBaseline"),

        getDeltaFromBaseline: () => {
          const state = get();
          if (!state.baseline) return null;
          
          return {
            resonanceScore: state.resonanceScore - state.baseline.resonanceScore,
            marketFriction: state.marketFriction - state.baseline.marketFriction,
            targetRevenue: state.targetRevenue - state.baseline.targetRevenue,
            integrationTax: state.computed.integrationTax - state.baseline.integrationTax,
            velocityMultiplier: state.computed.velocityMultiplier - state.baseline.velocityMultiplier,
            resonanceAlpha: state.computed.resonanceAlpha - state.baseline.resonanceAlpha,
            sovereignCertainty: state.computed.sovereignCertainty - state.baseline.sovereignCertainty
          };
        }
      })),
      { 
        name: "ogr-sovereign-storage",
        partialize: (state) => ({
          resonanceScore: state.resonanceScore,
          marketFriction: state.marketFriction,
          targetRevenue: state.targetRevenue,
          selectedBriefIds: state.selectedBriefIds,
          isRegistryOpen: state.isRegistryOpen,
          baseline: state.baseline,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    { name: "OGR_Intelligence_Engine" }
  )
);