// pages/security.tsx — INSTITUTIONAL SECURITY & GOVERNANCE PROTOCOL
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import PolicyFooter from "@/components/PolicyFooter";

const SecurityPage: NextPage = () => {
  const lastUpdated = React.useMemo(
    () => new Date().toLocaleDateString("en-GB", { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }),
    []
  );

  return (
    <Layout title="Security Policy | Abraham of London">
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:py-32">
        {/* HEADER SECTION */}
        <header className="border-b border-white/10 pb-12 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
              Protocol // Governance
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 italic">
            Security Policy
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md font-light">
              Security at Abraham of London is managed as a core governance pillar rather than a technical feature. 
              We operate a defense-in-depth model designed to protect the integrity of our 163-dispatch registry 
              and the privacy of our Inner Circle members.
            </p>
            <div className="text-right">
              <span className="block font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                Revision Date: {lastUpdated}
              </span>
              <span className="block font-mono text-[9px] text-zinc-800 uppercase tracking-widest mt-1">
                Ref: AOL-SEC-2026-V1
              </span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* NAVIGATION (DESKTOP) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-32 h-fit">
            <nav className="space-y-4">
              {['Security by Design', 'Bot Protection', 'Rate Limiting', 'Data Minimisation', 'Incident Response'].map((item, i) => (
                <div key={item} className="flex items-center gap-3 group cursor-pointer">
                  <span className="font-mono text-[8px] text-amber-500/40">0{i+1}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                    {item}
                  </span>
                </div>
              ))}
            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* 1. Security by Design */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">1. Security by Design</h2>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 font-light leading-relaxed">
                <p>
                  The Abraham of London platform is engineered with a focus on <strong>attack surface reduction</strong>. 
                  By utilizing a decoupled, static-first architecture, we eliminate the vast majority of server-side 
                  vulnerabilities inherent in traditional database-driven websites.
                </p>
                <p>
                  Every component is assessed for security impact before deployment. Our infrastructure is 
                  managed via secure CI/CD pipelines with encrypted environmental variables and strictly limited 
                  administrative access.
                </p>
              </div>
            </section>

            {/* 2. Automated Defenses */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">2. Bot Protection & reCAPTCHA v3</h2>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 font-light leading-relaxed">
                <p>
                  Public interface points are protected via <strong>Google reCAPTCHA v3</strong> and proprietary 
                  behavioral analysis. Unlike traditional systems, we do not disrupt the user experience with 
                  interruptive challenges. Instead:
                </p>
                <ul className="list-none p-0 space-y-3">
                  <li className="flex gap-4 items-start border-l border-amber-500/20 pl-4 py-1">
                    <span className="text-amber-500 font-mono text-[10px] mt-1">A</span>
                    <span>Action-specific scoring differentiates human intent from scripted abuse in real-time.</span>
                  </li>
                  <li className="flex gap-4 items-start border-l border-amber-500/20 pl-4 py-1">
                    <span className="text-amber-500 font-mono text-[10px] mt-1">B</span>
                    <span>Hidden honeypot fields act as silent neutralizers for automated form submissions.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. Cryptographic Integrity */}
            <section className="space-y-4 bg-white/[0.02] border border-white/5 p-8 rounded-sm">
              <h2 className="font-serif text-2xl text-white italic">3. Inner Circle Protection</h2>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 font-light leading-relaxed">
                <p>
                  Membership within the Inner Circle is protected by modern cryptographic standards. 
                  We do not store your raw personal data in a way that is retrievable by our staff:
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-amber-500" />
                    <span><strong>Email Hashing:</strong> Addresses are stored as unique SHA-256 hashes.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-amber-500" />
                    <span><strong>Key Security:</strong> Access keys are cryptographically hashed and validated at the edge.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-amber-500" />
                    <span><strong>Minimal Retension:</strong> We retain only the metadata required for resource delivery.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. Incident Response */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">4. Incident Response Protocol</h2>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                In the event of a suspected security breach, our internal protocol dictates immediate triage, 
                containment, and remediation. We commit to transparency where an incident has a material impact 
                on user data.
              </p>
              <div className="p-4 border border-zinc-800 bg-zinc-900/50 rounded-sm">
                <p className="font-mono text-[10px] text-zinc-500 uppercase mb-2">Security Reporting</p>
                <p className="text-sm text-white">
                  To report vulnerabilities or suspicious activity, please contact: <br className="md:hidden" />
                  <span className="text-amber-500 underline underline-offset-4">Security@AbrahamOfLondon.com</span>
                </p>
              </div>
            </section>

            {/* 5. User Responsibilities */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-white italic">5. Your Security Responsibilities</h2>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                Platform security is a shared responsibility. We advise all stakeholders to:
              </p>
              <ul className="list-disc ml-4 text-xs text-zinc-500 space-y-2">
                <li>Treat Inner Circle access keys as sensitive credentials.</li>
                <li>Avoid transmitting financial or medical data via standard contact forms.</li>
                <li>Verify the authenticity of any communication claiming to be from "Abraham of London."</li>
              </ul>
            </section>
          </div>
        </section>

        <div className="mt-32 pt-12 border-t border-white/5">
          <PolicyFooter isDark />
        </div>
      </main>

      <style jsx global>{`
        body { background-color: #000; }
      `}</style>
    </Layout>
  );
};

export default SecurityPage;