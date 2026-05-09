import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { buildClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import { generateProofPack } from "@/lib/product/proof-pack-generator";

function buildRuntimeVerificationOversightBrief(input: {
  email: string;
  organisationId?: string;
}): OversightBrief {
  const now = new Date().toISOString();
  return {
    briefId: `runtime-verification:${input.organisationId ?? input.email}`,
    accountId: input.organisationId ?? input.email,
    periodStart: now,
    periodEnd: now,
    executiveSummary:
      "Runtime verification artifact generated because no retained oversight account could be composed from local evidence. This confirms PDF rendering only and does not imply active retained coverage, automated oversight, or verified outcomes.",
    activeCases: [],
    counsel: {
      reviewsTriggered: 0,
      requiredNow: 0,
    },
    boardroom: {
      dossiersAvailable: 0,
      exportsQueued: 0,
    },
    verification: {
      commitmentsDue: 0,
      commitmentsVerified: 0,
      unresolvedBreaches: 0,
    },
    patternRecurrence: {
      status: "UNAVAILABLE",
      priorCount: 0,
      explanation: "No retained oversight scope was available in the local runtime fixture.",
    },
    requiredActions: [],
    structuredActions: [],
  };
}

export async function generateOversightBriefPdfBuffer(input: {
  email: string;
  userId?: string;
  organisationId?: string;
}) {
  const composed = await composeOversightBrief(input);
  const brief = composed.brief ?? buildRuntimeVerificationOversightBrief(input);

  const clientSafeBrief = buildClientSafeOversightBrief({
    brief,
    access: {
      allowed: true,
      role: "OWNER",
      scopes: ["CONTROL_ROOM_VIEW"],
      reason: "Runtime verification",
      privacyBoundary: {
        canViewAggregates: true,
        canViewRawResponses: false,
        canViewNamedRespondents: false,
        smallSampleSuppressionApplies: true,
      },
    },
    audience: "CLIENT_SPONSOR",
  });

  const generatedAt = new Date().toISOString();
  const { ensureFontsRegistered } = await import("@/lib/pdf/ensure-fonts");
  await ensureFontsRegistered();
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { OversightBriefPdfDocument } = await import("@/lib/pdf/oversight-brief-pdf");
  const documentElement = OversightBriefPdfDocument({ clientSafeBrief, generatedAt });
  const pdfBuffer = await renderToBuffer(documentElement as ReactElement<DocumentProps>);

  return {
    briefId: brief.briefId,
    generatedAt,
    clientSafeBrief,
    pdfBuffer: Buffer.from(pdfBuffer),
  };
}

export async function generateProofPackPdfBuffer(input: {
  email: string;
  userId?: string;
}) {
  const pack = await generateProofPack(input);
  const generatedAt = new Date().toISOString();
  const { ensureFontsRegistered } = await import("@/lib/pdf/ensure-fonts");
  await ensureFontsRegistered();
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { ProofPackPdfDocument } = await import("@/lib/pdf/proof-pack-pdf");
  const documentElement = ProofPackPdfDocument({ pack, generatedAt });
  const pdfBuffer = await renderToBuffer(documentElement as ReactElement<DocumentProps>);

  return {
    generatedAt,
    pack,
    pdfBuffer: Buffer.from(pdfBuffer),
  };
}
