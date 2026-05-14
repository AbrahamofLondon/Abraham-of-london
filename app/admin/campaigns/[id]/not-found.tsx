// app/admin/campaigns/[id]/not-found.tsx
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function CampaignNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md w-full border border-white/10 bg-zinc-950/70 p-10 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-white/10 bg-white/5">
          <ShieldCheck className="h-7 w-7 text-white/30" />
        </div>
        <h1 className="mb-2 font-serif text-xl text-white">Campaign Not Found</h1>
        <p className="mb-8 text-sm leading-relaxed text-white/50">
          The requested campaign could not be found in the Sovereign Alignment Registry.
        </p>
        <Link
          href="/admin/campaigns"
          className="inline-block border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 hover:text-white/90"
        >
          Return to Campaign Registry
        </Link>
      </div>
    </div>
  );
}