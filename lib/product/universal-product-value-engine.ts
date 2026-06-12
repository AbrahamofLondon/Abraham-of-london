import { getAllProducts } from "@/lib/commercial/catalog";
import {
  type ProductValueContract,
  getAllProductValueContracts,
  getProductValueContract,
  isPaidContract,
  isPremiumContract,
} from "@/lib/product/product-value-contracts";
import { assessProductIntake, type ProductIntakePayload } from "@/lib/product/product-intake-requirements";
import {
  evaluateValueReadinessGate,
  type ValueReadinessGateResult,
} from "@/lib/product/value-readiness-gate";
import type { ArtefactContentInspectionInput } from "@/lib/product/artefact-content-inspector";

export interface UniversalProductValueEngineResult {
  productCode: string;
  contract: ProductValueContract | null;
  intakeStatus: ReturnType<typeof assessProductIntake>;
  valueGate: ValueReadinessGateResult;
  structurallyReady: boolean;
  valueReady: boolean;
  blockedPendingInput: boolean;
  notReadyForPaidDelivery: boolean;
}

export function evaluateUniversalProductValue(params: {
  productCode: string;
  gate: ValueReadinessGateResult["gate"];
  contentInspection: Omit<ArtefactContentInspectionInput, "productCode" | "contract">;
  intake?: ProductIntakePayload | null;
}): UniversalProductValueEngineResult {
  const contract = getProductValueContract(params.productCode);
  const intakeStatus = assessProductIntake(params.productCode, params.intake, contract);
  const valueGate = evaluateValueReadinessGate(params.gate, {
    ...params.contentInspection,
    productCode: params.productCode,
    contract,
  });
  const structurallyReady = Boolean(contract);
  const valueReady = valueGate.allowed && intakeStatus.generationAllowed;
  const blockedPendingInput = !intakeStatus.generationAllowed;
  const notReadyForPaidDelivery = Boolean(contract && isPaidContract(contract) && !valueReady);

  return {
    productCode: params.productCode,
    contract,
    intakeStatus,
    valueGate,
    structurallyReady,
    valueReady,
    blockedPendingInput,
    notReadyForPaidDelivery,
  };
}

export function getUniversalProductValueCoverage() {
  const products = getAllProducts();
  const contracts = getAllProductValueContracts();
  const paidContracts = contracts.filter(isPaidContract);
  const premiumContracts = contracts.filter(isPremiumContract);

  return {
    productsReviewed: products.length,
    paidProductsReviewed: paidContracts.length,
    premiumProductsReviewed: premiumContracts.length,
    contracts,
    paidContracts,
    premiumContracts,
  };
}
