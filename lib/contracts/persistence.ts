/**
 * Contract Persistence — Prisma-backed storage for Pattern-Breaker Contracts.
 */

import type { PatternBreakerContract } from "./types";

type PrismaClient = {
  patternBreakerContract: {
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
    findMany: (args: { where: Record<string, unknown>; orderBy?: Record<string, string>; take?: number }) => Promise<Array<Record<string, unknown>>>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
};

export async function persistContract(prisma: PrismaClient, contract: PatternBreakerContract): Promise<{ id: string }> {
  return prisma.patternBreakerContract.create({
    data: {
      id: contract.id,
      source: contract.source,
      sourceId: contract.sourceId ?? null,
      ownerName: contract.ownerName ?? null,
      ownerEmail: contract.ownerEmail ?? null,
      commitment: contract.commitment,
      avoidedPattern: contract.avoidedPattern ?? null,
      consequenceOfInaction: contract.consequenceOfInaction ?? null,
      canonSignals: contract.canonSignals,
      canonDefinitions: contract.canonDefinitions,
      dueAt: new Date(contract.dueAt),
      checkpoints: contract.checkpoints,
      status: contract.status,
      verificationStatus: contract.verificationStatus,
      breachCount: contract.breachCount,
      escalationLevel: contract.escalationLevel,
    },
  });
}

export async function loadContract(prisma: PrismaClient, id: string): Promise<PatternBreakerContract | null> {
  const row = await prisma.patternBreakerContract.findUnique({ where: { id } });
  if (!row) return null;
  return rowToContract(row);
}

export async function loadContractsByEmail(prisma: PrismaClient, email: string): Promise<PatternBreakerContract[]> {
  const rows = await prisma.patternBreakerContract.findMany({
    where: { ownerEmail: email },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(rowToContract);
}

export async function updateContractInDb(prisma: PrismaClient, contract: PatternBreakerContract): Promise<void> {
  await prisma.patternBreakerContract.update({
    where: { id: contract.id },
    data: {
      status: contract.status,
      verificationStatus: contract.verificationStatus,
      breachCount: contract.breachCount,
      escalationLevel: contract.escalationLevel,
      checkpoints: contract.checkpoints,
      updatedAt: new Date(),
    },
  });
}

function rowToContract(row: Record<string, unknown>): PatternBreakerContract {
  return {
    id: String(row.id),
    source: String(row.source) as PatternBreakerContract["source"],
    sourceId: row.sourceId ? String(row.sourceId) : undefined,
    ownerName: row.ownerName ? String(row.ownerName) : undefined,
    ownerEmail: row.ownerEmail ? String(row.ownerEmail) : undefined,
    commitment: String(row.commitment),
    avoidedPattern: row.avoidedPattern ? String(row.avoidedPattern) : undefined,
    consequenceOfInaction: row.consequenceOfInaction ? String(row.consequenceOfInaction) : undefined,
    canonSignals: Array.isArray(row.canonSignals) ? row.canonSignals as string[] : [],
    canonDefinitions: Array.isArray(row.canonDefinitions) ? row.canonDefinitions as string[] : [],
    dueAt: row.dueAt instanceof Date ? row.dueAt.toISOString() : String(row.dueAt),
    checkpoints: Array.isArray(row.checkpoints) ? row.checkpoints as PatternBreakerContract["checkpoints"] : [],
    status: String(row.status) as PatternBreakerContract["status"],
    verificationStatus: String(row.verificationStatus) as PatternBreakerContract["verificationStatus"],
    breachCount: Number(row.breachCount) || 0,
    escalationLevel: String(row.escalationLevel) as PatternBreakerContract["escalationLevel"],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}
