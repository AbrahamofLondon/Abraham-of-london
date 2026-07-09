import { CATALOG } from "@/lib/commercial/catalog";
import { getGovernanceState } from "@/lib/commercial/commercial-governance";
import { resolveCommercialAction } from "@/lib/commercial/commercial-action-resolver";
import { generateAllVerdicts } from "@/lib/fulfilment/estate-verdict-layer";
import { routePathExists } from "@/lib/fulfilment/estate-evidence-registry";
import { getContractByProductCode } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "@/lib/product/product-fulfilment-assurance";

export type ControlledReleasePrimaryClass =
  | "INTENTIONAL_GOVERNANCE_CONTROL"
  | "TEMPORARY_IMPLEMENTATION_DEFICIT"
  | "EXTERNAL_EVIDENCE_DEPENDENCY";

export type ControlledProofCell = {
  proven: boolean;
  evidence: string;
};

export type ControlledReleaseProofRow = {
  productCode: string;
  productName: string;
  primaryClass: ControlledReleasePrimaryClass;
  reasonForControl: string;
  accessMode: string;
  humanApprovalRequirement: string;
  ownerOrReviewer: string;
  escalationRoute: string;
  temporaryImplementationDeficit: boolean;
  checkoutDisabledWhereRequired: ControlledProofCell;
  directApiBypassBlocked: ControlledProofCell;
  commercialResolverAction: ControlledProofCell;
  fulfilmentPath: ControlledProofCell;
  deliveryGate: ControlledProofCell;
  claimBoundary: ControlledProofCell;
  bypassPrevention: ControlledProofCell;
};

function primaryClass(productCode: string): ControlledReleasePrimaryClass {
  if (productCode === "gmi_q2_2026") return "EXTERNAL_EVIDENCE_DEPENDENCY";
  return "INTENTIONAL_GOVERNANCE_CONTROL";
}

function reasonFor(productCode: string, fulfilmentType: string, commercialStatus: string): string {
  if (productCode === "gmi_q2_2026") return "Future post-8-July data lock and separate owner release authority are not yet available.";
  if (productCode === "gmi_quarterly") return "Edition-specific source blockers, data lock, prior-call review, human editorial review, owner authority, and artifact-hash binding are permanent governance gates.";
  if (commercialStatus === "contracted") return "Enterprise/retainer scope must be contracted and provisioned intentionally; no self-serve purchase authority.";
  if (commercialStatus === "manual_billing") return "Manual billing and scope/recipient approval are intentional access boundaries.";
  if (fulfilmentType === "human_reviewed_dossier" || fulfilmentType === "executive_report_artifact") return "High-risk or judgment-bearing output requires review, approval, and delivery proof before claims.";
  return "Controlled access prevents checkout/action bypass until governance and fulfilment proof are present.";
}

export function buildControlledReleaseProofMatrix(): ControlledReleaseProofRow[] {
  return generateAllVerdicts()
    .filter((v) => v.disposition === "CONTROLLED_RELEASE_READY")
    .map((verdict) => {
      const product = CATALOG[verdict.productCode];
      const governance = getGovernanceState(verdict.productCode);
      const contract = getContractByProductCode(verdict.productCode);
      const assurance = getAssuranceByProductCode(verdict.productCode);
      const action = product ? resolveCommercialAction(product, governance, { routeAvailable: true }) : null;
      const adminRoute = contract?.adminRoute ?? "/admin/fulfilment";
      const route = contract?.customerAccessRoute ?? contract?.intakeRoute ?? adminRoute;
      const commercialStatus = product?.commercialStatus ?? contract?.commercialStatus ?? "unknown";
      const fulfilmentType = contract?.fulfilmentType ?? "unknown";
      const cls = primaryClass(verdict.productCode);
      const temporaryImplementationDeficit = !contract || !assurance || (route ? !routePathExists(route) : false);

      return {
        productCode: verdict.productCode,
        productName: verdict.productName,
        primaryClass: temporaryImplementationDeficit ? "TEMPORARY_IMPLEMENTATION_DEFICIT" : cls,
        reasonForControl: reasonFor(verdict.productCode, fulfilmentType, commercialStatus),
        accessMode: action?.state ?? "unresolved",
        humanApprovalRequirement: assurance?.humanReviewJustification.required ? assurance.humanReviewJustification.reason : "governance_or_operator_approval_when_required",
        ownerOrReviewer: assurance?.humanReviewJustification.humanRole ?? (verdict.productCode.startsWith("gmi") ? "Owner/editorial reviewer" : "Operator/admin reviewer"),
        escalationRoute: adminRoute,
        temporaryImplementationDeficit,
        checkoutDisabledWhereRequired: {
          proven: action?.purchasable === false,
          evidence: `resolver=${action?.state}; purchasable=${action?.purchasable}`,
        },
        directApiBypassBlocked: {
          proven: governance.checkoutAllowed === false || product?.requiresCheckout !== true || product?.commercialStatus !== "paid",
          evidence: `checkoutAllowed=${governance.checkoutAllowed}; requiresCheckout=${product?.requiresCheckout}; commercialStatus=${product?.commercialStatus}`,
        },
        commercialResolverAction: {
          proven: Boolean(action && action.state !== "checkout" && action.purchasable === false),
          evidence: `state=${action?.state}; href=${action?.href}`,
        },
        fulfilmentPath: {
          proven: Boolean(contract?.fulfilmentType && contract.deliveryModel),
          evidence: `${contract?.fulfilmentType} / ${contract?.deliveryModel}`,
        },
        deliveryGate: {
          proven: Boolean(assurance?.deliveryClass && (assurance.humanReviewJustification.required || action?.purchasable === false)),
          evidence: `deliveryClass=${assurance?.deliveryClass}; humanReview=${assurance?.humanReviewJustification.required}`,
        },
        claimBoundary: {
          proven: verdict.reason.length > 0 && !verdict.reason.toLowerCase().includes("release_ready_now"),
          evidence: verdict.reason,
        },
        bypassPrevention: {
          proven: action?.purchasable === false && Boolean(contract) && Boolean(assurance),
          evidence: "commercial resolver + fulfilment contract + assurance gate",
        },
      };
    });
}
