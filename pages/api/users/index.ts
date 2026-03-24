// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { withApiRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit-unified";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";

interface User {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

type UsersApiSuccess = {
  success: true;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    timestamp: string;
    endpoint: string;
    source: string;
    authenticated: boolean;
    user?: string | null;
    model?: string;
  };
};

type UsersApiError = {
  success: false;
  error: string;
  message?: string;
  allowed?: string[];
};

type UsersApiResponse = UsersApiSuccess | UsersApiError;

type PrismaLikeDelegate = {
  count: (args?: Record<string, unknown>) => Promise<number>;
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
};

type UserDelegateResolution = {
  delegate: PrismaLikeDelegate | null;
  modelName: string | null;
};

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toIsoString(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function pickFirstString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function pickId(obj: Record<string, unknown>): string | number {
  const id = obj.id ?? obj.userId ?? obj.uuid ?? obj._id ?? "";
  if (typeof id === "string" || typeof id === "number") return id;
  return "";
}

function detectUserDelegate(prismaClient: unknown): UserDelegateResolution {
  const prismaRecord = prismaClient as Record<string, unknown>;

  const candidates = [
    "user",
    "User",
    "appUser",
    "AppUser",
    "users",
    "Users",
    "member",
    "Member",
    "accountUser",
    "AccountUser",
  ];

  for (const modelName of candidates) {
    const candidate = prismaRecord[modelName];
    if (
      candidate &&
      typeof candidate === "object" &&
      typeof (candidate as PrismaLikeDelegate).count === "function" &&
      typeof (candidate as PrismaLikeDelegate).findMany === "function"
    ) {
      return {
        delegate: candidate as PrismaLikeDelegate,
        modelName,
      };
    }
  }

  return {
    delegate: null,
    modelName: null,
  };
}

function normalizeDbUser(row: unknown): User {
  const obj = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;

  const email = pickFirstString(obj, ["email", "emailAddress", "username", "login"]);
  const firstName = pickFirstString(obj, ["firstName", "givenName"]);
  const lastName = pickFirstString(obj, ["lastName", "familyName"]);
  const fullName = pickFirstString(obj, ["name", "fullName", "displayName"]);

  let name = fullName;
  if (!name) {
    name = [firstName, lastName].filter(Boolean).join(" ").trim();
  }
  if (!name) {
    name = email || "Unknown User";
  }

  const role = pickFirstString(obj, ["role", "userRole", "accessRole"]) || "user";

  return {
    id: pickId(obj),
    name,
    email,
    role,
    createdAt: toIsoString(
      obj.createdAt ??
        obj.created_at ??
        obj.updatedAt ??
        obj.updated_at,
    ),
  };
}

function buildSearchWhere(search: string): Record<string, unknown> {
  if (!search) return {};

  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ],
  };
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsersApiResponse>,
): Promise<void> {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({
        success: false,
        error: "Method not allowed",
        allowed: ["GET"],
      });
      return;
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    const pageNum = toPositiveInt(req.query.page, 1);
    const limitNum = clamp(toPositiveInt(req.query.limit, 10), 1, 100);
    const search = asString(req.query.search).trim();
    const skip = (pageNum - 1) * limitNum;

    const { delegate, modelName } = detectUserDelegate(prisma);

    if (!delegate || !modelName) {
      res.status(500).json({
        success: false,
        error: "User model not available",
        message: "No user-like Prisma model found on the generated client",
      });
      return;
    }

    const where = buildSearchWhere(search);

    let totalUsers = 0;
    let dbUsers: unknown[] = [];

    try {
      totalUsers = await delegate.count({ where });

      dbUsers = await delegate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });
    } catch (dbError) {
      console.error("[/api/users] Database query failed:", dbError);

      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
        message: dbError instanceof Error ? dbError.message : "Database query failed",
      });
      return;
    }

    const users = Array.isArray(dbUsers) ? dbUsers.map(normalizeDbUser) : [];

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        totalPages: Math.max(1, Math.ceil(totalUsers / limitNum)),
        hasNextPage: pageNum * limitNum < totalUsers,
        hasPrevPage: pageNum > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: "/api/users",
        source: "pages-router",
        authenticated: true,
        user: session.user?.email ?? null,
        model: modelName,
      },
    });
  } catch (error) {
    console.error("[/api/users] API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default withApiRateLimit(handler, RATE_LIMIT_CONFIGS.authenticated);