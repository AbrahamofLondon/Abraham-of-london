import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import type { OversightOperatorPermission, OversightOperatorRole } from "@/lib/product/operator-role-contract";
import { OPERATOR_ROLE_PERMISSIONS } from "@/lib/product/operator-role-contract";

const envRoleMap: Array<[OversightOperatorRole, string]> = [
  ["SUPER_ADMIN", process.env.OVERSIGHT_SUPER_ADMIN_EMAILS || process.env.BOOTSTRAP_ADMIN_EMAILS || ""],
  ["OPERATOR", process.env.OVERSIGHT_OPERATOR_EMAILS || process.env.BOOTSTRAP_ADMIN_EMAILS || ""],
  ["REVIEWER", process.env.OVERSIGHT_REVIEWER_EMAILS || ""],
  ["COUNSEL", process.env.OVERSIGHT_COUNSEL_EMAILS || ""],
  ["FINANCE", process.env.OVERSIGHT_FINANCE_EMAILS || ""],
];

function normalize(email: string | null | undefined): string | null {
  return email ? email.trim().toLowerCase() : null;
}

function emailsFor(value: string): string[] {
  return value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export function deriveOversightOperatorRole(email: string | null | undefined): OversightOperatorRole | null {
  const normalized = normalize(email);
  if (!normalized) return null;
  for (const [role, envValue] of envRoleMap) {
    if (emailsFor(envValue).includes(normalized)) return role;
  }
  return null;
}

export function roleHasPermission(role: OversightOperatorRole | null, permission: OversightOperatorPermission): boolean {
  if (!role) return false;
  return OPERATOR_ROLE_PERMISSIONS[role].includes(permission);
}

export async function requireOversightRole(
  req: NextApiRequest,
  res: NextApiResponse,
  input: {
    routeKey: string;
    permission: OversightOperatorPermission;
  },
) {
  const session = await requireAdminServer(req, res, {
    routeKey: input.routeKey,
  });
  if (!session) return null;

  const email = normalize(typeof session.user?.email === "string" ? session.user.email : null);
  const role = deriveOversightOperatorRole(email);
  if (!roleHasPermission(role, input.permission)) {
    res.status(403).json({
      ok: false,
      error: "OVERSIGHT_ROLE_FORBIDDEN",
      reason: `Role ${role ?? "UNKNOWN"} does not permit ${input.permission}.`,
    });
    return null;
  }

  return { session, role };
}
