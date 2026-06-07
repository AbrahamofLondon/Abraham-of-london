/**
 * lib/research/brief-order-repository.ts
 *
 * Approved Prisma consumer for DecisionBriefOrder operations.
 * Foundry API routes must use this repository — no direct prisma imports.
 *
 * Listed in APPROVED_PRISMA_CONSUMERS in tests/research/canary/no-direct-prisma.test.ts.
 */

import { prisma } from "@/lib/prisma.server";

export type BriefOrderWhere = {
  status?: string;
  tier?: string;
};

export async function listBriefOrders(where: BriefOrderWhere = {}, take = 100) {
  const filter: Record<string, unknown> = {};
  if (where.status && where.status !== "all") filter.status = where.status;
  if (where.tier && where.tier !== "all") filter.tier = where.tier;
  return prisma.decisionBriefOrder.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listAllBriefOrders() {
  return prisma.decisionBriefOrder.findMany();
}

export async function findBriefOrder(id: string) {
  return prisma.decisionBriefOrder.findUnique({ where: { id } });
}

export async function updateBriefOrderStatus(
  id: string,
  status: string,
  extra: Record<string, unknown> = {},
) {
  return prisma.decisionBriefOrder.update({
    where: { id },
    data: { status, ...extra },
  });
}
