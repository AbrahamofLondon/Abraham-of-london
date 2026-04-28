import Link from "next/link";

export default function EnterpriseAssessmentSuite() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/30 p-8 text-white shadow-sm">
      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/70">
        Enterprise Assessment
      </div>
      <h2 className="mt-4 font-serif text-3xl font-light tracking-tight">
        Continue in the canonical enterprise assessment flow
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
        This legacy surface has been retired. The governed enterprise assessment
        now runs through the main diagnostic route and returns a public-safe
        institutional reading with state, posture, directive, required action,
        and escalation status.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/diagnostics/enterprise-assessment"
          className="inline-flex rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
        >
          Open enterprise assessment
        </Link>
        <Link
          href="/diagnostics"
          className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
        >
          Back to diagnostics
        </Link>
      </div>
    </div>
  );
}
