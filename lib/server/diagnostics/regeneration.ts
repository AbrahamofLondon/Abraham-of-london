// server-only guard removed — Pages Router incompatible
import { prisma } from "@/lib/prisma.server";
import { archiveDiagnosticPdf } from "./report-archive";
import { getDiagnosticRecordByRef } from "./store";

export async function queueRegeneration(diagnosticRef: string) {
  return prisma.diagnosticRegenerationJob.create({
    data: {
      diagnosticRef,
      status: "queued",
    },
  });
}

export async function processRegenerationJobs(limit = 5) {
  const jobs = await prisma.diagnosticRegenerationJob.findMany({
    where: { status: "queued" },
    take: limit,
  });

  for (const job of jobs) {
    try {
      await prisma.diagnosticRegenerationJob.update({
        where: { id: job.id },
        data: { status: "processing", attempt: job.attempt + 1 },
      });

      const record = await getDiagnosticRecordByRef(job.diagnosticRef);
      if (!record) throw new Error("Record missing");

      await archiveDiagnosticPdf({ item: record });

      await prisma.diagnosticRegenerationJob.update({
        where: { id: job.id },
        data: { status: "completed" },
      });
    } catch (err: any) {
      await prisma.diagnosticRegenerationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error: String(err?.message || err),
        },
      });
    }
  }
}
