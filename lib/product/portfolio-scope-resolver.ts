import { prisma } from "@/lib/prisma.server";

export type PortfolioScope = {
  contractId: string;
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
};

export type PortfolioScopeResolution = {
  scopeMode: "single_org" | "multi_scope" | "cross_org";
  scopes: PortfolioScope[];
  authorisedOrganisationCount: number;
  authorisedScopeCount: number;
  crossOrgAllowed: boolean;
};

function normalizeEmail(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export async function resolvePortfolioScopes(input: {
  role: string;
  email?: string | null;
  userId?: string | null;
  organisationId?: string | null;
}): Promise<PortfolioScopeResolution> {
  const email = normalizeEmail(input.email);
  const crossOrgAllowed = ["ADMIN", "OPERATOR", "OWNER"].includes(input.role);

  const contracts = await prisma.retainerContract.findMany({
    where: {
      status: "ACTIVE",
      ...(input.organisationId ? { organisationId: input.organisationId } : {}),
      ...(crossOrgAllowed
        ? {}
        : {
            organisation: {
              memberships: {
                some: {
                  OR: [
                    ...(email ? [{ email }] : []),
                    ...(input.userId ? [{ userId: input.userId }] : []),
                  ],
                  status: "active",
                },
              },
            },
          }),
    },
    select: {
      id: true,
      organisationId: true,
      organisation: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: crossOrgAllowed ? 200 : 50,
  });

  const scopes = contracts.map((contract) => ({
    contractId: contract.id,
    organisationId: contract.organisationId,
    organisationName: contract.organisation.name,
    organisationSlug: contract.organisation.slug,
  }));
  const organisationIds = new Set(scopes.map((scope) => scope.organisationId));
  const scopeMode = scopes.length <= 1
    ? "single_org"
    : organisationIds.size > 1
      ? "cross_org"
      : "multi_scope";

  return {
    scopeMode,
    scopes,
    authorisedOrganisationCount: organisationIds.size,
    authorisedScopeCount: scopes.length,
    crossOrgAllowed,
  };
}
