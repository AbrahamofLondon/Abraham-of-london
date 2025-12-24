// lib/api-session.ts - Simple session helper for API routes
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize, type SerializeOptions } from "cookie";

const COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const SESSION_COOKIE = "session_id";

/**
 * Get or create a session ID
 */
export function getOrSetSessionId(
  req: NextApiRequest,
  res: NextApiResponse
): string {
  const cookies = req.cookies || {};
  let sessionId = cookies[SESSION_COOKIE];
  
  if (!sessionId) {
    // Generate simple session ID
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    res.setHeader(
      "Set-Cookie",
      serialize(SESSION_COOKIE, sessionId, COOKIE_OPTIONS)
    );
  }
  
  return sessionId;
}

/**
 * Get slug from request parameters
 */
export function getSlugParam(req: NextApiRequest): string | null {
  const { slug } = req.query;
  
  if (!slug) return null;
  
  if (Array.isArray(slug)) {
    return slug[0] || null;
  }
  
  return slug;
}