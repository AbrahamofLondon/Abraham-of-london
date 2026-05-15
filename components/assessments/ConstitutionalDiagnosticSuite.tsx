import ConstitutionalDiagnostic from "@/components/diagnostics/ConstitutionalDiagnostic";
import type { ConstitutionalBundle } from "@/lib/diagnostics/assessment-result-mappers";

type Props = {
  onComplete?: (bundle: ConstitutionalBundle) => void;
};

export default function ConstitutionalDiagnosticSuite({ onComplete }: Props = {}) {
  return <ConstitutionalDiagnostic onComplete={onComplete} />;
}
