import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Layers, Vault } from "lucide-react";

export default function ServiceLines(): JSX.Element {
  const items = [
    {
      icon: <Briefcase className="h-5 w-5 text-amber-300" />,
      title: "Advisory",
      body: "Institutional-grade strategy for founders and leadership teams.",
      href: "/consulting",
      badge: "Engage",
    },
    {
      icon: <Layers className="h-5 w-5 text-amber-300" />,
      title: "The Canon",
      body: "Foundational architecture: purpose, governance, civilisation, legacy.",
      href: "/canon",
      badge: "Explore",
    },
    {
      icon: <Vault className="h-5 w-5 text-amber-300" />,
      title: "The Vault",
      body: "Deployable assets: templates, operator packs, and implementation tools.",
      href: "/downloads/vault",
      badge: "Access",
    },
  ];

  return (
    <section className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {items.map((x) => (
            <Link
              key={x.title}
              href={x.href}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 hover:border-amber-400/25 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10">
                  {x.icon}
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/60">
                  {x.badge}
                </span>
              </div>

              <h3 className="mt-5 font-serif text-2xl font-bold text-white group-hover:text-amber-200 transition-colors">
                {x.title}
              </h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">{x.body}</p>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-200">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}