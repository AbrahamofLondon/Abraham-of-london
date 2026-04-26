/**
 * /foundations — Intellectual foundations. Separate inherited knowledge from original frameworks.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const SECTIONS = [
  { id: "scriptural", title: "I. Scriptural Foundations", sources: "Genesis, Deuteronomy, Proverbs, Romans, Acts, Revelation", description: "The ordering principles of creation, stewardship, authority, and justice that provide the moral architecture underlying governance models." },
  { id: "classical", title: "II. Classical Thought", sources: "Plato, Aristotle, Aquinas, Augustine", description: "Virtue ethics, natural law, institutional order, and the relationship between individual character and collective governance." },
  { id: "historical", title: "III. Historical Analysis", sources: "Herodotus, Tacitus, Ibn Khaldun, Toynbee", description: "Civilisational cycle theory, institutional decay patterns, and the structural conditions that produce stability or collapse." },
  { id: "sociology", title: "IV. Sociology & Human Systems", sources: "Weber, Durkheim, Douglas, Frankl", description: "Institutional rationality, social cohesion, meaning-making, and the structural conditions for ordered human behaviour." },
  { id: "political", title: "V. Political Theory", sources: "Burke, Madison, Tocqueville, Oakeshott, Fukuyama", description: "Institutional conservatism, constitutional design, the relationship between political order and moral foundations." },
  { id: "economics", title: "VI. Economics & Statecraft", sources: "Smith, Hayek, Sowell", description: "Market order, spontaneous systems, the limits of central planning, and the economics of decision-making under uncertainty." },
  { id: "cultural", title: "VII. Cultural Analysis", sources: "Rieff, Postman, Guinness", description: "The relationship between cultural order, institutional integrity, and the conditions under which societies lose coherence." },
];

const FoundationsPage: NextPage = () => (
  <Layout title="Foundations | Abraham of London" description="The intellectual traditions behind the Canon and decision systems." canonicalUrl="/foundations">
    <Head><meta name="robots" content="index,follow" /></Head>
    <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="mx-auto max-w-2xl">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Intellectual Foundations</span>
        <h1 style={{ ...serif, fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.90)", marginTop: "0.5rem" }}>
          The traditions behind the system.
        </h1>

        <p className="mt-4" style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.40)", maxWidth: "48ch" }}>
          The Canon is a structured synthesis drawing from theological, philosophical, and institutional traditions. Its contribution is not the invention of new source material, but the integration of established bodies of knowledge into a coherent decision architecture designed for modern organisational and governance challenges.
        </p>

        <div className="mt-10 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.id} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255,255,255,0.70)" }}>{s.title}</h2>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: `${GOLD}70`, marginTop: "0.3rem" }}>{s.sources}</p>
              <p className="mt-2 text-sm" style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>{s.description}</p>
            </section>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${GOLD}15` }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Proprietary Systems</span>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.7 }}>
            The following are original frameworks developed by Abraham of London, derived from the traditions above but applied as structured decision systems:
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {["Alignment Index", "Decision Instruments", "Intelligence Spine", "Constitutional Diagnostic", "Strategy Room", "Evidence Ledger"].map((fw) => (
              <div key={fw} style={{ padding: "6px 10px", border: `1px solid ${GOLD}12`, fontSize: "0.82rem", color: `${GOLD}AA` }}>{fw}</div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm" style={{ color: "rgba(255,255,255,0.25)", lineHeight: 1.7, fontStyle: "italic" }}>
          The Canon builds on these traditions but does not replicate them. Its originality lies in structured synthesis and application to modern decision authority challenges.
        </p>

        {/* Cross-links: from foundations to application */}
        <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>From foundations to application</span>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/evidence" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Applied evidence</Link>
            <Link href="/playbooks" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Public playbooks</Link>
            <Link href="/verification" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Verify credentials</Link>
            <Link href="/canon/glossary" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: `1px solid ${GOLD}12`, color: `${GOLD}60` }}>Canon glossary</Link>
          </div>
        </div>

        <p className="mt-8" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
          Developed by Abraham Adaramola · Founder, Abraham of London
        </p>
      </div>
    </main>
  </Layout>
);

export default FoundationsPage;
