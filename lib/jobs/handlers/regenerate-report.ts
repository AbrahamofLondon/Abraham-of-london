import { prisma } from "@/lib/prisma";

export async function regenerateReport(payload: {
  artifactId: string;
}) {
  const artifact = await prisma.diagnosticArtifact.findUnique({
    where: { id: payload.artifactId },
  });

  if (!artifact) throw new Error("ARTIFACT_NOT_FOUND");

  await prisma.diagnosticArtifact.update({
    where: { id: artifact.id },
    data: {
      version: `${artifact.version}-regen`,
    },
  });
}
