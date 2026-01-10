// lib/inner-circle/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.INNER_CIRCLE_JWT_SECRET || "inner-circle-secret-change-in-production"
);

export interface InnerCircleJWT {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'patron' | 'inner-circle' | 'founder';
  tier: 'inner-circle';
  iat: number;
  exp: number;
}

export async function createInnerCircleToken(user: {
  id: string;
  email: string;
  name: string;
  role: InnerCircleJWT['role'];
}): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: 'inner-circle',
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d") // 90 days
    .sign(JWT_SECRET);

  return token;
}

export async function verifyInnerCircleToken(token: string): Promise<InnerCircleJWT | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as InnerCircleJWT;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export function decodeToken(token: string): InnerCircleJWT | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return payload as InnerCircleJWT;
  } catch (error) {
    console.error("Token decode failed:", error);
    return null;
  }
}

// Client-side helper (safe for browser)
export function decodeClientToken(token: string): InnerCircleJWT | null {
  if (typeof window === "undefined") return null;
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as InnerCircleJWT;
  } catch (error) {
    console.error("Client token decode failed:", error);
    return null;
  }
}

// Validate token expiry
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

// Create a simple token for development
export function createDevToken(): string {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev tokens only available in development");
  }
  
  const payload = {
    id: "dev_001",
    email: "dev@abrahamoflondon.org",
    name: "Development User",
    role: "inner-circle" as const,
    tier: "inner-circle" as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
  };
  
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const payload64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = "dev-signature"; // Not real, just for dev
  
  return `${header}.${payload64}.${signature}`;
}
