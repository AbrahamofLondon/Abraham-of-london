// lib/strategy-room/client-trackers.ts

import type {
  CanonicalSections,
  CanonicalSectionsEnvelope,
} from "@/lib/decision/canonical-sections";
import { hasCanonicalSections } from "@/lib/decision/canonical-sections";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";

type TrackConversionArgs = {
  sessionKey: string;
  conversionType: string;
  metadata?: Record<string, unknown>;
  canonical?: CanonicalSectionsEnvelope | CanonicalSections | null;
};

type TrackFollowupArgs = {
  sessionKey: string;
  routeAfter: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
  readinessTierAfter: string;
  authorityTypeAfter: string;
  clarityDelta: number;
  authorityDelta: number;
  convertedAfterGuidance: boolean;
  metadata?: Record<string, unknown>;
  canonical?: CanonicalSectionsEnvelope | CanonicalSections | null;
};

function resolveCanonical(
  value: CanonicalSectionsEnvelope | CanonicalSections | null | undefined
) {
  if (!value) return null;
  if (hasCanonicalSections(value)) {
    return normalizeCanonicalSectionsSnapshot({
      envelope: value,
      source: "client-tracker",
    });
  }

  return normalizeCanonicalSectionsSnapshot({
    sections: value as CanonicalSections,
    source: "client-tracker",
  });
}

export async function trackConversion(args: TrackConversionArgs) {
  const canonicalSnapshot = resolveCanonical(args.canonical);

  try {
    await fetch("/api/strategy-room/session/conversion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionKey: args.sessionKey,
        conversionType: args.conversionType,
        metadata: args.metadata ?? {},
        canonicalSnapshot,
      }),
    });
  } catch (error) {
    console.error("[TRACK_CONVERSION_ERROR]", error);
  }
}

export async function trackFollowup(args: TrackFollowupArgs) {
  const canonicalSnapshot = resolveCanonical(args.canonical);

  try {
    await fetch("/api/strategy-room/session/followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionKey: args.sessionKey,
        routeAfter: args.routeAfter,
        readinessTierAfter: args.readinessTierAfter,
        authorityTypeAfter: args.authorityTypeAfter,
        clarityDelta: args.clarityDelta,
        authorityDelta: args.authorityDelta,
        convertedAfterGuidance: args.convertedAfterGuidance,
        metadata: args.metadata ?? {},
        canonicalSnapshot,
      }),
    });
  } catch (error) {
    console.error("[TRACK_FOLLOWUP_ERROR]", error);
  }
}