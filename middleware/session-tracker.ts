// middleware/session-tracker.ts
// ─── CONSTITUTIONAL SESSION TRACKING MIDDLEWARE ─────────────────────────────────

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionTracker } from "@/lib/analytics/session-tracker";
import { getCanonicalSectionsFromRequest } from "@/lib/decision/canonical-sections";

// Paths that should trigger session tracking
const TRACKABLE_PATHS = [
  "/dashboard",
  "/pdf-dashboard",
  "/admin/reporting",
  "/admin/campaigns",
  "/api/reports",
  "/api/constitutional",
  "/api/interventions",
  "/api/strategy-room",
];

// Paths that should trigger conversion events
const CONVERSION_PATHS = [
  "/api/interventions",
  "/api/constitutional/appeal",
  "/api/constitutional/override",
];

export async function sessionTrackingMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const { pathname, method } = req.nextUrl;
  
  // Only track relevant paths and GET/API requests
  const shouldTrack = TRACKABLE_PATHS.some(path => pathname.startsWith(path));
  
  if (!shouldTrack) {
    return null;
  }
  
  // Get or create session ID from cookie
  let sessionId = req.cookies.get("constitutional_session_id")?.value;
  const userId = req.headers.get("X-User-Id") || 
                 req.cookies.get("user_id")?.value ||
                 req.cookies.get("next-auth.session-token")?.value;
  
  const campaignId = extractCampaignId(pathname);
  
  // Get canonical snapshot if available
  let canonicalSnapshot = null;
  try {
    canonicalSnapshot = await getCanonicalSectionsFromRequest(req);
  } catch (error) {
    console.error("[SessionTracker] Failed to get canonical snapshot:", error);
  }
  
  // Determine event type
  let eventType: "SESSION_INIT" | "IMPRESSION" | "FOLLOW_UP" | "CONVERSION" = "IMPRESSION";
  let isConversion = false;
  
  if (!sessionId && userId && campaignId) {
    eventType = "SESSION_INIT";
  } else if (CONVERSION_PATHS.some(path => pathname.startsWith(path)) && method === "POST") {
    eventType = "CONVERSION";
    isConversion = true;
  }
  
  // If we have a session ID, update it
  if (sessionId) {
    try {
      if (isConversion && canonicalSnapshot) {
        await sessionTracker.recordConversion(
          sessionId,
          campaignId || "unknown",
          userId || "anonymous",
          eventType === "CONVERSION" ? "CONVERSION" : "FOLLOW_UP",
          canonicalSnapshot,
          null,
          { url: pathname, method, isConversion: true }
        );
      } else if (canonicalSnapshot) {
        await sessionTracker.recordEvent(
          sessionId,
          campaignId || "unknown",
          userId || "anonymous",
          eventType,
          canonicalSnapshot,
          null,
          { url: pathname, method }
        );
      }
    } catch (error) {
      console.error("[SessionTracker] Failed to record event:", error);
    }
  }
  
  // Create new session if needed
  if (!sessionId && userId && campaignId && canonicalSnapshot && eventType === "SESSION_INIT") {
    try {
      const session = await sessionTracker.initSession(
        campaignId,
        userId,
        canonicalSnapshot,
        {
          userAgent: req.headers.get("user-agent") || undefined,
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
          source: "middleware",
          url: pathname,
        }
      );
      sessionId = session.id;
    } catch (error) {
      console.error("[SessionTracker] Failed to init session:", error);
    }
  }
  
  // Set session cookie if we have a session ID
  if (sessionId) {
    const response = NextResponse.next();
    response.cookies.set("constitutional_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    return response;
  }
  
  return null;
}

function extractCampaignId(pathname: string): string | undefined {
  // Pattern: /campaigns/[id]/*
  const campaignMatch = pathname.match(/\/campaigns\/([^\/]+)/);
  if (campaignMatch) return campaignMatch[1];
  
  // Pattern: /admin/campaigns/[id]/*
  const adminMatch = pathname.match(/\/admin\/campaigns\/([^\/]+)/);
  if (adminMatch) return adminMatch[1];
  
  // Pattern: /api/reports/[id]/*
  const reportMatch = pathname.match(/\/api\/reports\/([^\/]+)/);
  if (reportMatch) return reportMatch[1];
  
  // Pattern: /api/constitutional/export?campaignId=[id]
  const urlParams = new URLSearchParams(pathname.split("?")[1] || "");
  const campaignIdParam = urlParams.get("campaignId");
  if (campaignIdParam) return campaignIdParam;
  
  return undefined;
}