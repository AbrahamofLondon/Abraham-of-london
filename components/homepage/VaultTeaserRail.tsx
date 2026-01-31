// components/homepage/VaultTeaserRail.tsx — VAULT TEASER (conversion without begging)
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, FileText, Workflow, Scale } from "lucide-react";

export default function VaultTeaserRail() {
  const items = [
    { icon: <Workflow className="h-5 w-5" />, title: "Operating Cadence", body: "Weekly rhythm, meeting packs, and owner loops." },
    { icon: <Scale className="h-5 w-5" />, title: "Governance Artefacts", body: "Decision rights, controls, and accountability rails." },
    { icon: <FileText className="h-5 w-5" />, title: "Templates & Packs", body: "Institutional objects you can deploy immediately." },
  ];

  return (
    <section className="relative bg-black py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(59,130,246,0.06),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                Vault assets
              </p>
              <h3 className="mt-5 font-serif text-4xl font-light text-amber-100">
                The work behind the words.
              </h3>
              <p className="mt-5 text-lg font-light leading-relaxed text-gray-300">
                The Vault is a curated pack of institutional artefacts — built for builders who actually deploy.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/downloads/vault"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-4 text-sm font-bold text-black shadow-2xl shadow-amber-900/25 transition-all hover:scale-[1.02]"
                >
                  <Lock className="h-4 w-4" />
                  Open the Vault
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-semibold text-gray-200 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  Preview Frameworks <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-6 md:grid-cols-3">
                {items.map((x) => (
                  <div
                    key={x.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                  >
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                      {x.icon}
                    </div>
                    <p className="text-base font-semibold text-amber-100">{x.title}</p>
                    <p className="mt-2 text-sm font-light leading-relaxed text-gray-300">
                      {x.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6">
                <p className="text-sm font-light text-amber-100">
                  **Conversion line that doesn’t beg:** If you can’t deploy it, it doesn’t belong in the Vault.
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
                  Templates • Playbooks • Packs • Operator Notes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}