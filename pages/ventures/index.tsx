/* pages/ventures/index.tsx — VENTURE PORTFOLIO */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Activity,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Briefcase,
  TrendingUp as TrendingUpIcon,
  Building,
  Shield,
  Layers
} from "lucide-react";

import Layout from "@/components/Layout";

type VentureStatus = "Operational" | "Development" | "Inactive";

interface Venture {
  name: string;
  slug: string;
  sector: string;
  description: string;
  domain: string[];
  established: string;
  url: string;
  status: VentureStatus;
}

const statusIndicators: Record<VentureStatus, { text: string; border: string }> = {
  "Operational": { text: "text-emerald-400", border: "border-emerald-400/20" },
  "Development": { text: "text-amber-400", border: "border-amber-400/20" },
  "Inactive": { text: "text-gray-500", border: "border-gray-500/20" },
};

const VenturesPage: NextPage = () => {
  const ventures: Venture[] = [
    {
      name: "Alomarada Ltd",
      slug: "alomarada",
      sector: "Institutional Advisory",
      description: "We provide governance frameworks and strategic operating systems for boards and institutions navigating complex market environments. Our work centers on aligning oversight, execution, and succession across organizational structures.",
      domain: ["Governance", "Strategic Advisory", "Organizational Design"],
      established: "2018",
      url: "https://alomarada.com",
      status: "Operational"
    },
    {
      name: "Endureluxe",
      slug: "endureluxe",
      sector: "Health & Performance",
      description: "A community-centered approach to physical and mental health. We develop training systems and performance tools while maintaining open access to resources that support sustainable practice across experience levels.",
      domain: ["Community Health", "Performance Systems", "Equipment Design"],
      established: "2024",
      url: "https://alomarada.com/endureluxe",
      status: "Operational"
    },
    {
      name: "InnovateHub",
      slug: "innovatehub",
      sector: "Product & Venture Development",
      description: "Structured frameworks for product strategy and venture architecture. We work with founders and organizations to establish systematic approaches to development, resource allocation, and market positioning.",
      domain: ["Product Strategy", "Venture Architecture", "Market Development"],
      established: "2024",
      url: "https://innovatehub.abrahamoflondon.org",
      status: "Development"
    }
  ];

  const domainIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    "Governance": Shield,
    "Strategic Advisory": TrendingUpIcon,
    "Organizational Design": Building,
    "Community Health": Activity,
    "Performance Systems": Layers,
    "Equipment Design": Briefcase,
    "Product Strategy": Lightbulb,
    "Venture Architecture": Building2,
    "Market Development": TrendingUpIcon,
  };

  return (
    <Layout 
      title="Portfolio" 
      description="Applied frameworks across institutional, performance, and development domains."
    >
      <Head>
        <meta property="og:image" content="https://abrahamoflondon.org/ventures-og.png" />
        <link rel="canonical" href="https://abrahamoflondon.org/ventures" />
      </Head>
      
      <main className="min-h-screen bg-black text-white">
        {/* HEADER */}
        <section className="border-b border-white/5 pt-32 pb-24">
          <div className="mx-auto max-w-5xl px-6">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white mb-8 leading-[1.1]">
              Integrated systems<br />
              across domains
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-3xl">
              Three decades of philosophical development applied through operational platforms. 
              Each venture represents systematic application of principle-based frameworks to specific market challenges.
            </p>
          </div>
        </section>

        {/* VENTURES */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="space-y-24">
              {ventures.map((venture, index) => {
                return (
                  <div key={venture.slug} className={`${index !== 0 ? 'border-t border-white/5 pt-24' : ''}`}>
                    <div className="grid lg:grid-cols-12 gap-12">
                      {/* Meta Column */}
                      <div className="lg:col-span-4">
                        <div className="sticky top-24">
                          <div className="mb-8">
                            <div className="flex items-baseline gap-4 mb-6">
                              <span className="font-mono text-xs text-gray-600">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <span className={`text-[10px] font-medium uppercase tracking-[0.15em] border rounded-full px-3 py-1 ${statusIndicators[venture.status].text} ${statusIndicators[venture.status].border}`}>
                                {venture.status}
                              </span>
                            </div>
                            <h2 className="text-3xl font-serif font-light text-white mb-3 leading-tight">
                              {venture.name}
                            </h2>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                              {venture.sector}
                            </p>
                          </div>
                          
                          <div className="space-y-6 text-sm">
                            <div>
                              <h4 className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-600 mb-3">
                                Established
                              </h4>
                              <p className="text-gray-400">{venture.established}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-600 mb-3">
                                Domain Focus
                              </h4>
                              <div className="space-y-2">
                                {venture.domain.map((d) => {
                                  const Icon = domainIcons[d] || Briefcase;
                                  return (
                                    <div key={d} className="flex items-center gap-2 text-gray-400">
                                      <Icon className="h-3.5 w-3.5 text-gray-600" />
                                      <span className="text-sm">{d}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content Column */}
                      <div className="lg:col-span-8">
                        <div className="prose prose-invert prose-lg max-w-none">
                          <p className="text-gray-300 leading-relaxed mb-12">
                            {venture.description}
                          </p>
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-white/5">
                          <a 
                            href={venture.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white transition-colors group"
                          >
                            <span>Visit platform</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* METHODOLOGY */}
        <section className="py-32 border-t border-white/5 bg-white/[0.01]">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5">
                <h2 className="font-serif text-4xl font-light text-white mb-8 leading-tight">
                  Philosophical foundation,<br />
                  operational precision
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Our approach integrates conceptual rigor with market discipline. 
                  Frameworks emerge from sustained philosophical work, tested across professional engagements and refined through direct application.
                </p>
              </div>
              
              <div className="lg:col-span-7">
                <div className="space-y-12">
                  {[
                    {
                      title: "Integration over isolation",
                      description: "Solutions account for interconnected systems—organizational, market, and human. Fragmented approaches produce fragmented results."
                    },
                    {
                      title: "Structure before scale",
                      description: "Growth without architectural integrity creates unsustainable expansion. We establish foundational systems capable of bearing increased complexity."
                    },
                    {
                      title: "Succession as design principle",
                      description: "Institutional continuity requires deliberate succession planning from inception. We build for generational transfer, not founder dependency."
                    },
                    {
                      title: "Measured deployment",
                      description: "Strategic patience prevents premature execution. Market timing matters, but not at the expense of structural readiness."
                    }
                  ].map((item, i) => (
                    <div key={i} className="border-l-2 border-white/10 pl-6">
                      <h3 className="text-lg font-medium text-white mb-3">{item.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ENGAGEMENT */}
        <section className="py-24 border-t border-white/5">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
              Strategic engagements
            </h2>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              We work with leadership teams and institutions prepared for systematic approaches to complex challenges.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 font-medium hover:bg-gray-100 transition-colors"
              >
                Initiate conversation
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/canon" 
                className="inline-flex items-center justify-center gap-2 border border-white/10 px-8 py-4 font-medium text-white hover:bg-white/5 transition-colors"
              >
                Explore the Canon
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VenturesPage;