import { CATALOG } from "@/lib/commercial/catalog";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";
import { resolvePricingAction } from "@/lib/commercial/pricing-actions";
import { getGmiPublicEditionContent } from "./gmi-public-edition-content";
import type { GmiEditionLink, GmiEditionPublicContract } from "./gmi-public-edition-contract";
import {
  getMarketIntelligenceRecord,
  getPublicMarketIntelligenceReports,
  type MarketIntelligenceLifecycleRecord,
} from "./market-intelligence-lifecycle";

const ACTIVE_STATES = new Set(["ACTIVE", "ACTIVE_UNTIL_SUPERSEDED"]);
const PUBLIC_ARCHIVE_STATES = new Set(["SUPERSEDED", "ARCHIVED"]);

type GmiDb = { gmiEditionReleaseState?: { findMany: (args?: unknown) => Promise<Array<{ editionId: string; lifecycleState: string; supersededBy: string | null; publicVisible: boolean }>> } };
type DurableStoreModule = {
  getDurableReleaseState: (editionId: string, db?: GmiDb) => Promise<{ lifecycleState: GmiEditionPublicContract["lifecycleState"]; publicVisible: boolean; purchasable: boolean; supersededBy: string | null; publishedAt: Date | null; candidateHash: string | null; sourceSnapshotHash: string | null; reportContentHash: string | null; methodologyVersion: string | null } | null>;
  getDurableReceipt: (editionId: string, db?: GmiDb) => Promise<{ id: string; candidateHash: string; sourceSnapshotHash: string; reportContentHash: string; methodologyVersion: string; pdfHash: string | null } | null>;
};
async function loadDurableStoreForTests(): Promise<DurableStoreModule> {
  const specifier = "./gmi-release-store.server";
  return await import(specifier) as DurableStoreModule;
}

const PUBLIC_RELEASE_PROOFS: Record<string, {
  receiptRef: string | null;
  candidateHash: string | null;
  reportContentHash: string | null;
  sourceSnapshotHash: string | null;
  pdfHash: string | null;
  methodologyVersion: string | null;
}> = {
  "GMI-Q2-2026": {
    receiptRef: "cmrclih4i0004y4icxtnidewy",
    candidateHash: "gmi-q2-2026-candidate-20260708-release-lock",
    reportContentHash: "gmi-q2-2026-report-content-20260708-v1",
    sourceSnapshotHash: "gmi-q2-2026-source-snapshot-20260708-release-lock",
    pdfHash: "9f584a1a34d2f0a678e2c180c7cc158eab3d3123f09514cc1f16e139204e12df",
    methodologyVersion: "gmi-methodology-v1.0.0",
  },
};

export function gmiPublicSlugForEditionSlug(slug: string): string {
  return `global-market-intelligence-${slug}`;
}

export function gmiPublicHrefForEditionSlug(slug: string): string {
  return `/intelligence/${gmiPublicSlugForEditionSlug(slug)}`;
}

export function gmiEditionIdFromPublicSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  const prefix = "global-market-intelligence-";
  if (!normalized.startsWith(prefix)) return null;
  const editionSlug = normalized.slice(prefix.length);
  return GMI_EDITION_REGISTRY.find((entry) => entry.slug === editionSlug)?.editionId ?? null;
}

function entryForEdition(editionId: string) {
  return GMI_EDITION_REGISTRY.find((entry) => entry.editionId === editionId) ?? null;
}

function toEditionLink(record: MarketIntelligenceLifecycleRecord | null): GmiEditionLink | null {
  if (!record) return null;
  const entry = entryForEdition(record.id);
  if (!entry) return null;
  const status = ACTIVE_STATES.has(record.lifecycleState)
    ? "current"
    : PUBLIC_ARCHIVE_STATES.has(record.lifecycleState)
      ? "superseded"
      : "draft";
  return {
    editionId: record.id,
    title: record.title,
    slug: gmiPublicSlugForEditionSlug(entry.slug),
    href: gmiPublicHrefForEditionSlug(entry.slug),
    status,
  };
}

export async function resolveCurrentGmiEdition(db?: GmiDb): Promise<GmiEditionLink> {
  if (db?.gmiEditionReleaseState?.findMany) {
    const states = await db.gmiEditionReleaseState.findMany({
      where: {
        editionId: { in: GMI_EDITION_REGISTRY.map((entry) => entry.editionId) },
        lifecycleState: { in: ["ACTIVE", "ACTIVE_UNTIL_SUPERSEDED"] },
        supersededBy: null,
        publicVisible: true,
      },
      orderBy: { publishedAt: "desc" },
    });
    if (states.length !== 1) {
      throw new Error(`GMI current edition invariant failed: expected exactly one active public edition, found ${states.length}`);
    }
    const record = getMarketIntelligenceRecord(states[0]?.editionId ?? "");
    const link = toEditionLink(record);
    if (!link || link.status !== "current") {
      throw new Error(`GMI current edition ${states[0]?.editionId ?? "UNKNOWN"} has no public lifecycle link`);
    }
    return link;
  }

  const activeRecords = getPublicMarketIntelligenceReports().filter(
    (record) => ACTIVE_STATES.has(record.lifecycleState) && !record.supersededBy,
  );
  if (activeRecords.length !== 1) {
    throw new Error(`GMI current edition invariant failed: expected exactly one active public edition, found ${activeRecords.length}`);
  }
  const link = toEditionLink(activeRecords[0] ?? null);
  if (!link || link.status !== "current") {
    throw new Error(`GMI current edition ${(activeRecords[0] as MarketIntelligenceLifecycleRecord | undefined)?.id ?? "UNKNOWN"} has no public lifecycle link`);
  }
  return link;
}

export async function listPublicGmiEditions(db?: GmiDb): Promise<GmiEditionPublicContract[]> {
  const records = getPublicMarketIntelligenceReports();
  const contracts = await Promise.all(
    records.map((record) => resolvePublicGmiEdition(record.id, { db, allowDraftPreview: false }).catch(() => null)),
  );
  return contracts
    .filter((contract): contract is GmiEditionPublicContract => Boolean(contract))
    .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
}

export async function resolvePublicGmiEdition(
  editionId: string,
  opts: { db?: GmiDb; allowDraftPreview?: boolean } = {},
): Promise<GmiEditionPublicContract> {
  const record = getMarketIntelligenceRecord(editionId);
  const entry = entryForEdition(editionId);
  const content = getGmiPublicEditionContent(editionId);

  if (!record || !entry || !content) {
    throw new Error(`GMI public edition ${editionId} is not structurally defined`);
  }

  let releaseProof = PUBLIC_RELEASE_PROOFS[editionId] ?? {
    receiptRef: null,
    candidateHash: null,
    reportContentHash: null,
    sourceSnapshotHash: null,
    pdfHash: null,
    methodologyVersion: record.version ?? null,
  };
  let publicState = record.lifecycleState;
  let publicVisible = record.publicVisible;
  let purchasable = record.purchasable;
  let publishedAt = record.publishedAt ?? null;
  let supersededBy = record.supersededBy ?? null;
  if (process.env.NODE_ENV === "test" || opts.db) {
    const { getDurableReleaseState, getDurableReceipt } = await loadDurableStoreForTests();
    const durableState = await getDurableReleaseState(editionId, opts.db);
    if (durableState) {
      publicState = durableState.lifecycleState;
      publicVisible = durableState.publicVisible;
      purchasable = durableState.purchasable;
      publishedAt = durableState.publishedAt?.toISOString() ?? publishedAt;
      supersededBy = durableState.supersededBy;
      const receipt = await getDurableReceipt(editionId, opts.db);
      releaseProof = {
        receiptRef: receipt?.id ?? releaseProof.receiptRef,
        candidateHash: receipt?.candidateHash ?? durableState.candidateHash,
        reportContentHash: receipt?.reportContentHash ?? durableState.reportContentHash,
        sourceSnapshotHash: receipt?.sourceSnapshotHash ?? durableState.sourceSnapshotHash,
        pdfHash: receipt?.pdfHash ?? releaseProof.pdfHash,
        methodologyVersion: receipt?.methodologyVersion ?? durableState.methodologyVersion ?? releaseProof.methodologyVersion,
      };
    }
  }
  const isCurrent = ACTIVE_STATES.has(publicState) && !supersededBy;
  const isArchive = PUBLIC_ARCHIVE_STATES.has(publicState);
  const isPublic = publicVisible && (isCurrent || isArchive || opts.allowDraftPreview === true);

  if (!isPublic && opts.allowDraftPreview !== true) {
    throw new Error(`GMI public edition ${editionId} is not public`);
  }

  const currentEdition = await resolveCurrentGmiEdition(opts.db);
  const product = CATALOG[entry.productCode];
  if (!product) throw new Error(`GMI public edition ${editionId} has no catalog product ${entry.productCode}`);
  const pricing = resolvePricingAction(product);
  const checkoutEligible = isCurrent && purchasable && pricing.purchasable;

  const predecessor = record.replaces ? getMarketIntelligenceRecord(record.replaces) : null;
  const successor = record.supersededBy ? getMarketIntelligenceRecord(record.supersededBy) : null;

  return {
    editionId,
    familyId: "gmi-quarterly",
    title: record.title,
    shortTitle: `${record.quarter} ${record.year}`,
    slug: gmiPublicSlugForEditionSlug(entry.slug),
    periodStart: record.periodStart ?? "",
    periodEnd: record.periodEnd ?? "",
    publicationTarget: record.publicationTarget ?? record.publishedAt ?? entry.releaseDate ?? "",
    publishedAt,
    lifecycleState: publicState as GmiEditionPublicContract["lifecycleState"],
    isCurrent,
    isPublic,
    isPurchasable: checkoutEligible,
    predecessorEditionId: record.replaces ?? null,
    successorEditionId: supersededBy,
    version: record.version ?? "1.0.0",
    methodologyVersion: releaseProof.methodologyVersion ?? record.version ?? "1.0.0",
    hero: content.hero,
    executiveSummary: content.executiveSummary,
    marketRegime: content.marketRegime,
    headlineSignals: content.headlineSignals,
    boardConsequences: content.boardConsequences,
    thesisCards: content.thesisCards,
    falsificationSummary: content.falsificationSummary,
    methodology: {
      version: releaseProof.methodologyVersion ?? record.version ?? "1.0.0",
      ...content.methodology,
    },
    evidenceSummary: {
      sourceCount: content.sourceCount,
      coverageState: content.coverageState,
      sourceSnapshotHash: releaseProof.sourceSnapshotHash ?? undefined,
    },
    releaseProof: {
      receiptRef: releaseProof.receiptRef,
      candidateHash: releaseProof.candidateHash,
      reportContentHash: releaseProof.reportContentHash,
      pdfHash: releaseProof.pdfHash,
    },
    commerce: {
      commercialState: pricing.type,
      priceLabel: product.displayPrice ?? null,
      currency: product.amount > 0 ? "GBP" : null,
      checkoutEligible,
      productId: product.stripeProductId ?? null,
      priceAuthorityRef: product.stripePriceId ?? null,
      productCode: product.code,
    },
    pdf: {
      available: Boolean(content.pdfPath || releaseProof.pdfHash),
      downloadPath: content.pdfPath,
    },
    archiveContext: {
      previousEdition: toEditionLink(predecessor),
      nextEdition: toEditionLink(successor),
      currentEdition,
    },
  };
}