import {
  type ProductValueContract,
  type ValueInputRequirement,
  getProductValueContract,
} from "@/lib/product/product-value-contracts";

export type ProductIntakeStatus =
  | "intake_complete"
  | "awaiting_customer_input";

export interface ProductIntakeAssessment {
  productCode: string;
  status: ProductIntakeStatus;
  missingRequiredInput: ValueInputRequirement[];
  generationAllowed: boolean;
  requiredStateWhenMissing: "awaiting_customer_input";
}

export type ProductIntakePayload = Partial<Record<ValueInputRequirement["key"], unknown>>;

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length >= 8;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== null && value !== undefined;
}

export function assessProductIntake(
  productCode: string,
  intake: ProductIntakePayload | null | undefined,
  contract: ProductValueContract | null = getProductValueContract(productCode),
): ProductIntakeAssessment {
  const requiredInput = contract?.requiredInputBasis ?? [];
  const missingRequiredInput = requiredInput.filter((requirement) => (
    requirement.required && !hasMeaningfulValue(intake?.[requirement.key])
  ));

  const generationAllowed = missingRequiredInput.length === 0;

  return {
    productCode,
    status: generationAllowed ? "intake_complete" : "awaiting_customer_input",
    missingRequiredInput,
    generationAllowed,
    requiredStateWhenMissing: "awaiting_customer_input",
  };
}

export function assertProductIntakeReady(
  productCode: string,
  intake: ProductIntakePayload | null | undefined,
): void {
  const assessment = assessProductIntake(productCode, intake);
  if (!assessment.generationAllowed) {
    throw new Error(
      `PRODUCT_INTAKE_BLOCKED: ${productCode} must remain awaiting_customer_input. ` +
      `Missing: ${assessment.missingRequiredInput.map((item) => item.key).join(", ")}.`,
    );
  }
}
