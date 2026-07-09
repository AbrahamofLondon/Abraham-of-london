#!/usr/bin/env tsx
import { bootstrapProtectedGmiReleaseState, getCurrentValidAuthority, getDurableReceipt, getDurableReleaseState } from "../lib/intelligence/gmi-release-store.server";
import { resolveDurableReleaseState } from "../lib/intelligence/gmi-release-durable-resolver.server";
import { resolvePublicGmiEdition } from "../lib/intelligence/gmi-public-edition-resolver.server";
import { prisma } from "../lib/prisma";

async function main() {
  const editionId = process.argv[2];
  if (!editionId) {
    console.error("Usage: pnpm gmi:release:status GMI-Q2-2026");
    process.exit(1);
  }

  await bootstrapProtectedGmiReleaseState();
  const state = await getDurableReleaseState(editionId);
  const receipt = await getDurableReceipt(editionId);
  const authority = state?.candidateHash ? await getCurrentValidAuthority(editionId, state.candidateHash) : null;
  const gates = await resolveDurableReleaseState(editionId).catch((error) => ({ error: error instanceof Error ? error.message : String(error) }));
  const publicEdition = await resolvePublicGmiEdition(editionId).catch((error) => ({ error: error instanceof Error ? error.message : String(error) }));

  console.log(JSON.stringify({
    editionId,
    lifecycle: state?.lifecycleState ?? null,
    candidateHash: state?.candidateHash ?? null,
    dataLockedAt: state?.dataLockedAt ?? null,
    publishedAt: state?.publishedAt ?? null,
    publicVisible: state?.publicVisible ?? false,
    purchasable: state?.purchasable ?? false,
    ownerAuthority: authority ? { id: authority.id, authorizedBy: authority.authorizedBy, authorizedAt: authority.authorizedAt } : null,
    receipt: receipt ? { id: receipt.id, candidateHash: receipt.candidateHash, pdfHash: receipt.pdfHash } : null,
    releaseGates: gates,
    publicPage: "error" in publicEdition ? publicEdition : { slug: publicEdition.slug, isCurrent: publicEdition.isCurrent, checkoutEligible: publicEdition.commerce.checkoutEligible },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });