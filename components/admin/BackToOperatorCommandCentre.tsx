import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToOperatorCommandCentre() {
  return (
    <Link
      href="/admin/operator"
      className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
    >
      <ArrowLeft className="h-3 w-3" />
      Back to Operator Command Centre
    </Link>
  );
}
