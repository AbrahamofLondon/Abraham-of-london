// app/api/v2/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, safePrismaQuery } from "@/lib/prisma";

export const runtime = "nodejs";        // ✅ FIX: Node runtime (Prisma, env, etc.)
export const dynamic = "force-dynamic";

type Method = "GET" | "POST" | "PUT" | "DELETE";
type AnyObj = Record<string, any>;

function getBaseUrl(request: NextRequest): string {
  // Prefer explicit site URL in production
  const prod = process.env.NODE_ENV === "production";
  if (prod) return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  // Local dev
  return "http://localhost:3000";
}

async function forwardToV1(request: NextRequest, method: Method = "GET", body?: AnyObj) {
  const baseUrl = getBaseUrl(request);
  const v1Url = `${baseUrl}/api/v1/users`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Version": "v2",
    "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
    "User-Agent": request.headers.get("user-agent") || "v2-forwarder",
  };

  const authHeader = request.headers.get("authorization");
  if (authHeader) headers["Authorization"] = authHeader;

  const fetchOptions: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (body && (method === "POST" || method === "PUT")) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(v1Url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return NextResponse.json(
      {
        error: "Failed to fetch users from v1 API",
        status: response.status,
        message: errorText || "Upstream error",
      },
      { status: response.status }
    );
  }

  const data = await response.json();

  // Best-effort logging (must never break the request)
  try {
    await safePrismaQuery(() =>
      prisma.apiLog.create({
        data: {
          endpoint: "/api/v2/users",
          method,
          statusCode: response.status,
          userAgent: request.headers.get("user-agent") || "unknown",
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
          responseTime: 0,
        },
      })
    );
  } catch (e) {
    console.warn("[Users API v2] log failed:", e);
  }

  return NextResponse.json(data, {
    headers: {
      "X-API-Version": "v2",
      "X-API-Router": "app",
      "X-Forwarded-From": "v1",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function dbFallback(request: NextRequest) {
  // Prisma schema note: you said InnerCircleMember exists (not User)
  const usersResult = await safePrismaQuery(() =>
    prisma.innerCircleMember.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        tier: true,
        createdAt: true,
        lastSeenAt: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    })
  );

  const users = Array.isArray(usersResult) ? usersResult : [];

  return NextResponse.json(
    {
      data: users,
      meta: {
        source: "fallback-direct-db",
        count: users.length,
        warning: "V1 API unavailable, using InnerCircleMember database fallback",
      },
    },
    {
      status: 200,
      headers: {
        "X-API-Version": "v2",
        "X-API-Router": "app",
        "X-Fallback": "true",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    return await forwardToV1(request, "GET");
  } catch (err) {
    console.error("[Users API v2] GET forward error:", err);
    try {
      return await dbFallback(request);
    } catch (dbErr) {
      console.error("[Users API v2] GET db fallback error:", dbErr);
      return NextResponse.json(
        { error: "Internal server error", message: "GET failed" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    if (!body.email || !body.name) {
      return NextResponse.json({ error: "Missing required fields: email and name are required" }, { status: 400 });
    }

    return await forwardToV1(request, "POST", body);
  } catch (err) {
    console.error("[Users API v2] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ error: "Invalid request: id is required for updates" }, { status: 400 });
    }
    return await forwardToV1(request, "PUT", body);
  } catch (err) {
    console.error("[Users API v2] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    if (!userId) return NextResponse.json({ error: "User ID is required for deletion" }, { status: 400 });

    // if v1 expects ?id=, include it; otherwise delete by body, etc.
    return await forwardToV1(request, "DELETE");
  } catch (err) {
    console.error("[Users API v2] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}