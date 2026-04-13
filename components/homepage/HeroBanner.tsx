"use client";

/* components/homepage/HeroBanner.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct weights

   Previous version had:
   - rounded-full on every badge, signal card, and rail item hover
   - rounded-[22px] on signal cards and floating support cards
   - font-black/semibold throughout
   - bg-[#F4EFE6] filled CTA (off-white) — wrong pattern
   - "Index_1/DOC-01", "SEC-03", "PTR-04", "SIG-05" rail reference codes
   - "Institutional OS", "Active Dossier", "Secure File // AOFL-09"
   - "Status: Operational" — performed system status
   - emerald-400 rounded-full pulsing live indicator
   - Vertical perimeter lines flanking the entire page
   - #0E0E12 — non-canonical token (close to but not LIFT)

   Rebuilt: Left rail navigation, main title, right image block.
   All invented classification codes removed. Sharp throughout.
   Button import preserved — wraps the existing ui/Button component.
*/

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import { Shield, ArrowRight, ChevronRight, FileText, BriefcaseBusiness, Sparkles } from "lucide-react";

const GOLD = "#C9A96E";
const LIFT = "rgb(10 14 20)";

const RAIL_LINKS = [
  { href: "/canon",       label: "Canon",    desc: "Doctrine & method"        },
  { href: "/blog",        label: "Essays",   desc: "Literary intelligence"    },
  { href: "/vault/briefs",label: "Briefs",   desc: "Vault intelligence"       },
  { href: "/ventures",    label: "Ventures", desc: "Execution arms"           },
  { href: "/shorts",      label: "Shorts",   desc: "Short-form signal"        },
];

const SIGNALS = [
  { label: "Doctrine",     value: "Canon",    Icon: FileText        },
  { label: "Execution",    value: "Ventures", Icon: BriefcaseBusiness },
  { label: "Intelligence", value: "Vault",    Icon: Shield          },
];

export const HeroBanner = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { scrollY } = useScroll();
  const yMain  = useTransform(scrollY, [0, 600], [0, -48]);
  const yImage = useTransform(scrollY, [0, 600], [0, 34]);
  const railY  = useTransform(scrollY, [0, 600], [0, -18]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0.18]);

  const titleWords = React.useMemo(() => title.split(" "), [title]);

  return (
    <section
      className="relative isolate min-h-screen overflow-hidden pt-28 text-white lg:pt-36"
      style={{ backgroundColor: "rgb(6 6 9)" }}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at top left, ${GOLD}08, transparent 30%), linear-gradient(180deg, rgb(6 6 9) 0%, rgb(6 6 9) 55%, rgb(3 3 5) 100%)` }} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}36, transparent)` }} />
      </div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-10 2xl:px-14"
      >
        {/* Top bar */}
        <div style={{
          marginBottom: "3rem",
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.34em", textTransform: "uppercase",
              color: `${GOLD}BB`,
            }}>
              Institutional platform
            </span>
            <span style={{ color: "rgba(255,255,255,0.20)", margin: "0 0.25rem" }}>/</span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}>
              Strategic architecture
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {["London", "2026 Edition"].map((tag) => (
              <span key={tag} style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "4px 12px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.018)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">

          {/* ── Left rail ──────────────────────────────────────────────── */}
          <motion.aside style={{ y: railY }} className="hidden lg:col-span-2 lg:flex">
            <div style={{
              width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
              borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "1.75rem",
            }}>
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.30)",
                  }}>
                    Navigation
                  </span>
                  <div style={{ marginTop: "0.6rem", height: "1px", width: "3rem", background: `linear-gradient(to right, ${GOLD}55, transparent)` }} />
                </div>

                <nav style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} aria-label="Hero rail navigation">
                  {RAIL_LINKS.map((item) => (
                    <Link key={item.href} href={item.href} className="group block transition-transform duration-200 hover:translate-x-0.5">
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span
                          className="transition-colors duration-200 group-hover:[color:rgba(242,231,208,1)]"
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300, fontSize: "1.55rem", lineHeight: 1.0, letterSpacing: "-0.018em",
                            color: "rgba(255,255,255,0.82)",
                          }}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.15)", flexShrink: 0, marginBottom: "2px" }}
                          className="transition-all group-hover:translate-x-0.5 group-hover:[color:rgba(201,169,110,0.75)]"
                        />
                      </div>
                      <p style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.28)",
                      }} className="transition-colors group-hover:[color:rgba(255,255,255,0.50)]">
                        {item.desc}
                      </p>
                    </Link>
                  ))}
                </nav>
              </div>

              <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.25rem" }}>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65,
                  color: "rgba(255,255,255,0.40)",
                  maxWidth: "15rem",
                }}>
                  Doctrine, intelligence, and execution under one operating frame.
                </p>
              </div>
            </div>
          </motion.aside>

          {/* ── Main content ───────────────────────────────────────────── */}
          <motion.div style={{ y: yMain }} className="lg:col-span-6 xl:col-span-6">
            <div className="max-w-4xl">

              {/* Platform eyebrow — sharp, no rounded-full */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.6rem",
                padding: "5px 14px",
                border: `1px solid ${GOLD}25`,
                backgroundColor: `${GOLD}08`,
                marginBottom: "1.75rem",
              }}>
                <Sparkles style={{ width: "12px", height: "12px", color: `${GOLD}BB` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.30em", textTransform: "uppercase",
                  color: `${GOLD}CC`,
                }}>
                  Abraham of London
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(3rem, 7vw, 7rem)",
                lineHeight: 0.92, letterSpacing: "-0.04em",
                color: "rgba(255,255,255,0.95)",
              }}>
                {titleWords.map((word, i) => {
                  const norm = word.toLowerCase().replace(/[^\w]/g, "");
                  return (
                    <span
                      key={`${word}-${i}`}
                      style={norm === "london" ? { fontStyle: "italic", color: GOLD } : {}}
                    >
                      {word}{" "}
                    </span>
                  );
                })}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <div style={{
                  marginTop: "2rem",
                  borderLeft: `1px solid ${GOLD}35`,
                  paddingLeft: "1.5rem",
                  maxWidth: "44ch",
                }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "1.18rem", lineHeight: 1.72,
                    color: "rgba(255,255,255,0.72)",
                  }}>
                    {subtitle}
                  </p>
                </div>
              )}

              {/* CTAs */}
              <div style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Button
                  href="/canon"
                  className="group inline-flex items-center justify-center gap-3 border px-8 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.26em] transition-all duration-200"
                  style={{ borderColor: `${GOLD}38`, backgroundColor: "rgba(255,255,255,0.94)", color: "rgb(6 6 9)" }}
                >
                  Explore Canon
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>

                <Button
                  href="/vault"
                  className="group inline-flex items-center justify-center gap-3 border border-white/[0.09] px-8 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.26em] text-white/75 transition-all duration-200 hover:border-white/[0.18] hover:text-white"
                  style={{ backgroundColor: LIFT }}
                >
                  <Shield className="h-4 w-4" style={{ color: `${GOLD}BB` }} />
                  Open Vault
                </Button>

                <Button
                  href="/ventures"
                  className="inline-flex items-center justify-center gap-3 border border-white/[0.07] bg-transparent px-8 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.26em] text-white/60 transition-all duration-200 hover:border-white/[0.14] hover:text-white/85"
                >
                  Strategic Ventures
                </Button>
              </div>

              {/* Signal row — sharp tiles */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-10">
                {SIGNALS.map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: LIFT,
                      padding: "1rem 1.25rem",
                      transition: "border-color 300ms ease",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}22`}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                      <Icon style={{ width: "13px", height: "13px", color: `${GOLD}AA` }} />
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.38)",
                      }}>
                        {label}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.5rem", lineHeight: 1.0,
                      color: "rgba(255,255,255,0.85)",
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Right image block ──────────────────────────────────────── */}
          <motion.div style={{ y: yImage }} className="lg:col-span-4 xl:col-span-4">
            <div className="relative mx-auto max-w-[34rem] lg:mx-0">

              {/* Main image panel */}
              <div
                className="relative overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: LIFT,
                  boxShadow: "0 32px 84px rgba(0,0,0,0.52)",
                }}
              >
                <div className="absolute inset-x-0 top-0 z-20 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}45, transparent)` }} />

                <div className="relative" style={{ aspectRatio: "4/5" }}>
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London institutional portrait"
                    fill priority
                    className="object-cover object-center"
                    style={{ opacity: 0.84 }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.16) 40%, rgba(0,0,0,0.60) 100%)" }} />
                  <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)" }} />
                  {/* Inner frame — decorative precision border */}
                  <div className="absolute inset-[18px]" style={{ border: "1px solid rgba(255,255,255,0.09)" }} />
                </div>

                {/* Platform label — top left */}
                <div style={{
                  position: "absolute", top: "1.25rem", left: "1.25rem", zIndex: 20,
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "4px 12px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(6,6,9,0.92)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.70)",
                }}>
                  Selected works
                </div>

                {/* Bottom card */}
                <div style={{ position: "absolute", inset: 0, bottom: 0, top: "auto", zIndex: 20, padding: "1.25rem" }}>
                  <div style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(6,6,9,0.92)",
                    padding: "1rem 1.25rem",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem",
                  }}>
                    <div>
                      <p style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase",
                        color: `${GOLD}AA`, marginBottom: "0.5rem",
                      }}>
                        Platform
                      </p>
                      <h3 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.22rem", lineHeight: 1.15,
                        color: "rgba(255,255,255,0.88)",
                      }}>
                        Strategic leadership,<br />doctrine, and execution.
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two support tiles — sharp, no rounded */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { label: "Position", value: "Advisory-led platform" },
                  { label: "Mandate",  value: "Build what endures"    },
                ].map((item) => (
                  <div key={item.label} style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: LIFT,
                    padding: "0.85rem 1rem",
                  }}>
                    <p style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.32)", marginBottom: "0.35rem",
                    }}>
                      {item.label}
                    </p>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "1.1rem", lineHeight: 1.15,
                      color: "rgba(255,255,255,0.78)",
                    }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lower three-column strip */}
        <div style={{ marginTop: "3.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.5rem" }}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: "Doctrine",     body: "Structured thought, articulated principles, and written architecture." },
              { label: "Intelligence", body: "Essays, briefs, and distilled signals for leaders and builders."       },
              { label: "Execution",    body: "Ventures, systems, and strategic assets designed for durable impact."  },
            ].map((col) => (
              <div key={col.label}>
                <p style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                  color: `${GOLD}BB`, marginBottom: "0.6rem",
                }}>
                  {col.label}
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68,
                  color: "rgba(255,255,255,0.50)",
                }}>
                  {col.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroBanner;