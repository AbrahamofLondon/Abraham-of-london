// app/admin/campaigns/[id]/not-found.tsx
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function CampaignNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] p-8">
      <div className="max-w-md w-full bg-white p-12 shadow-sm border border-neutral-100 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neutral-50 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-xl font-medium text-neutral-900 mb-2">Campaign Not Found</h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          The requested campaign could not be found in the Sovereign Alignment Registry.
        </p>
        <Link
          href="/admin/campaigns"
          className="inline-block px-6 py-3 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
        >
          Return to Campaign Registry
        </Link>
      </div>
    </div>
  );
}