import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getExternalEvidenceGeneratedAt } from "../lib/product/external-product-value-evidence";
import {
  buildProductAuthorityBackboneReport,
  getProductAuthorityEstateProducts,
  type ProductAuthorityBackboneRecord,
} from "../lib/product/product-qualification-backbone";
import { resolveProductAuthority } from "../lib/product/resolve-product-authority";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function toBackboneJson(report: ReturnType<typeof buildProductAuthorityBackboneReport>) {
  const products = report.products;
  return {
    ...report,
    sourceGeneratedAt: getExternalEvidenceGeneratedAt(),
    breakdowns: {
      authorityStates: countBy(products.map((product) => product.authorityClearance.state)),
      evidenceStates: countBy(products.map((product) => product.evidence.evidenceState)),
      ledgerStates: countBy(products.map((product) => product.ledger.ledgerStatus)),
      genericAiStates: countBy(products.map((product) => product.genericAiComparison.state)),
      marketStates: countBy(products.map((product) => product.marketComparison.state)),
      antiToyStates: countBy(products.map((product) => product.antiToy.state)),
      redTeamStates: countBy(products.map((product) => product.redTeam.state)),
      v2States: countBy(products.map((product) => product.v2Revalidation.revalidationStatus)),
      validationConstitutionStates: countBy(
        products.map((product) => product.adapterVerification.validationConstitution.state),
      ),
      antiGamingStates: countBy(
        products.map((product) => product.adapterVerification.antiGaming.state),
      ),
      adversarialValidationStates: countBy(
        products.map((product) => product.adapterVerification.adversarialValidation.state),
      ),
      fulfilmentStates: countBy(
        products.map((product) => product.fulfilmentQualification.state),
      ),
      releaseStates: countBy(products.map((product) => product.releaseFirewall.state)),
      checkoutStates: countBy(products.map((product) => product.checkoutAgreement.state)),
    },
  };
}

function toLedgerStatusJson(products: ProductAuthorityBackboneRecord[], generatedAt: string) {
  return {
    generatedAt,
    totalProducts: products.length,
    summary: {
      ledgerStatuses: countBy(products.map((product) => product.ledger.ledgerStatus)),
      productsWithLedgerEntries: products.filter((product) => product.ledger.evidenceLedgerEntryExists).length,
      productsWithExplicitMissingLedgerStates: products.filter(
        (product) => product.ledger.ledgerStatus === "missing_entry",
      ).length,
      productsBlockedUntilSource: products.filter(
        (product) => product.ledger.ledgerStatus === "blocked_until_source",
      ).length,
      productsNotApplicable: products.filter(
        (product) => product.ledger.ledgerStatus === "not_applicable",
      ).length,
    },
    products: products.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      productFamily: product.productFamily,
      ledgerStatus: product.ledger.ledgerStatus,
      evidenceLedgerEntryExists: product.ledger.evidenceLedgerEntryExists,
      evidenceLedgerEntryId: product.ledger.evidenceLedgerEntryId,
      availableSources: product.ledger.availableSources,
      missingSources: product.ledger.missingSources,
      authorityConsequence: product.ledger.authorityConsequence,
      nextRequiredAction: product.ledger.nextRequiredAction,
    })),
  };
}

function toContractAuditJson(products: ProductAuthorityBackboneRecord[], generatedAt: string) {
  const contracts = getProductAuthorityEstateProducts().map((product) => {
    const contract = resolveProductAuthority({ productCode: product.code });
    return {
      productCode: product.code,
      productName: product.displayName,
      currentAuthorityState: contract.currentAuthorityState,
      authorityClearanceState: contract.authorityClearanceState ?? "unknown",
      evidenceSourceType: contract.evidenceSource.sourceType,
      publicClaimAllowed: contract.publicClaimAllowed,
      blockingReasons: contract.blockingReasons,
      nextEvidenceAction: contract.nextEvidenceAction,
      contractVersion: contract.contractVersion,
      validation: contract.validation,
    };
  });

  return {
    generatedAt,
    totalProducts: products.length,
    summary: {
      contractVersionCounts: countBy(contracts.map((contract) => contract.contractVersion)),
      authorityStateCounts: countBy(contracts.map((contract) => contract.currentAuthorityState)),
      authorityClearanceCounts: countBy(
        contracts.map((contract) => contract.authorityClearanceState),
      ),
      evidenceSourceCounts: countBy(contracts.map((contract) => contract.evidenceSourceType)),
      publicClaimAllowed: contracts.filter((contract) => contract.publicClaimAllowed).length,
    },
    products: contracts,
  };
}

function writeJson(path: string, payload: unknown) {
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function main() {
  mkdirSync(REPORTS_DIR, { recursive: true });

  const backboneReport = buildProductAuthorityBackboneReport();
  const products = backboneReport.products;
  const generatedAt = new Date().toISOString();

  const backboneJson = toBackboneJson(backboneReport);
  const ledgerJson = toLedgerStatusJson(products, generatedAt);
  const contractJson = toContractAuditJson(products, generatedAt);

  writeJson(join(REPORTS_DIR, "product-authority-backbone.json"), backboneJson);
  writeJson(join(REPORTS_DIR, "product-evidence-ledger-status.json"), ledgerJson);
  writeJson(join(REPORTS_DIR, "product-authority-contract.json"), contractJson);

  console.log("Generated product authority artifacts:");
  console.log("  reports/product-authority-backbone.json");
  console.log("  reports/product-evidence-ledger-status.json");
  console.log("  reports/product-authority-contract.json");
}

main();
