import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { canAccessArtifact, canAccessProduct, canAccessTier } from "./checks";
import { getUserAccess } from "./get-user-access";
import type { AccessTier, EffectiveAccess } from "./types";

type ApiResolution = {
  session: AccessSession | null;
  access: EffectiveAccess;
};

type AccessSession = Session & {
  user?: Session["user"] & {
    id?: string | null;
  };
};

export async function resolveRequestAccess(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<ApiResolution> {
  const session = (await getServerSession(req, res, authOptions)) as AccessSession | null;
  const access = await getUserAccess(prisma, session?.user?.id ?? null);
  return { session, access };
}

export async function requireAuthenticatedApi(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<ApiResolution | null> {
  const resolved = await resolveRequestAccess(req, res);
  if (!resolved.access.permissions.isAuthenticated) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return null;
  }
  return resolved;
}

export async function requireAdminApi(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<ApiResolution | null> {
  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return null;

  if (!resolved.access.permissions.isAdmin) {
    res.status(403).json({ ok: false, error: "Administrative access required" });
    return null;
  }

  return resolved;
}

export async function requireTierApi(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredTier: AccessTier,
): Promise<ApiResolution | null> {
  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return null;

  if (!canAccessTier(resolved.access, requiredTier)) {
    res.status(403).json({
      ok: false,
      error: "Insufficient tier",
      requiredTier,
      currentTier: resolved.access.tier,
    });
    return null;
  }

  return resolved;
}

export async function requireArtifactApi(
  req: NextApiRequest,
  res: NextApiResponse,
  artifactKey: string,
): Promise<ApiResolution | null> {
  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return null;

  if (!canAccessArtifact(resolved.access, artifactKey)) {
    res.status(403).json({
      ok: false,
      error: "Artifact entitlement required",
      artifactKey,
    });
    return null;
  }

  return resolved;
}

export async function requireProductApi(
  req: NextApiRequest,
  res: NextApiResponse,
  productKey: string,
): Promise<ApiResolution | null> {
  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return null;

  if (!canAccessProduct(resolved.access, productKey)) {
    res.status(403).json({
      ok: false,
      error: "Product entitlement required",
      productKey,
    });
    return null;
  }

  return resolved;
}

export async function resolvePageAccess(
  ctx: GetServerSidePropsContext,
): Promise<ApiResolution> {
  const session = (await getServerSession(ctx.req, ctx.res, authOptions)) as AccessSession | null;
  const access = await getUserAccess(prisma, session?.user?.id ?? null);
  return { session, access };
}

export async function requireAdminPage<T = Record<string, never>>(
  ctx: GetServerSidePropsContext,
  extraProps?: T,
): Promise<
  | { authorized: true; userId: string; access: EffectiveAccess; props: T }
  | { authorized: false; redirect: GetServerSidePropsResult<T> }
> {
  const { session, access } = await resolvePageAccess(ctx);

  if (!access.permissions.isAuthenticated || !session?.user?.id) {
    return {
      authorized: false,
      redirect: {
        redirect: {
          destination: `/admin/login?returnTo=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      },
    };
  }

  // Enforce canonical admin authority: email + role, not role alone
  const { isAdminEmail } = require("@/lib/auth/admin-authority");
  if (!access.permissions.isAdmin || !isAdminEmail(session?.user?.email)) {
    return {
      authorized: false,
      redirect: {
        redirect: {
          destination: "/auth/access-denied",
          permanent: false,
        },
      },
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
    access,
    props: (extraProps ?? {}) as T,
  };
}
