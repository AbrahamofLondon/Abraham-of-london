"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Crown,
  FileText,
  ShieldCheck,
  Scale,
  Target,
  Compass,
  Activity,
  Lock,
} from "lucide-react";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";
const CARD = "rgb(5 5 7)";

const TRANSITION = {
  duration: 0.62,
  ease: [0.22, 1, 0.36, 1] as const,
};

const SIGNALS = [
  "Use Diagnostics when the matter still requires disciplined reading and route clarity.",
  "Use Executive Reporting when the signal is serious enough to require structured interpretation.",
  "Use Strategy Room when consequence, execution pressure, and mandate fit are already material.",
];

const PATHWAYS = [
  {
    icon: Activity,
    title: "Signal before mandate",
    body: "The architecture begins with disciplined reading, not premature intervention.",
  },
  {
    icon: FileText,
    title: "Report before response",
    body: "Executive Reporting clarifies posture, pressure, exposure, and likely failure modes before advisory begins.",
  },
  {
    icon: Crown,
    title: "Escalation by fitness, not appetite",
    body: "Not every serious case belongs in private chamber work. The system protects fit, seriousness, and legitimacy.",
  },
  {
    icon: Scale,
    title: "Mandate under constitutional order",
    body: "The Strategy Room exists for cases where authority, stakes, and execution consequence require governed counsel.",
  },
];

const OUTCOMES = [
  {
    icon: Target,
    title: "Sharper decision chain",
    body: "Problem framing, route discipline, interpretation, and intervention move in sequence rather than as disconnected fragments.",
  },
  {
    icon: Compass,
    title: "Clearer mandate fit",
    body: "The right matters advance. The wrong matters are held, redirected, or declined without confusion or theatre.",
  },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={
        soft
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
      }
    />
  );
}

function LabelPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "4px 10px",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "6.5px",
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.42)",
      }}
    >
      {children}
    </span>
  );
}

function Surface({
  children,
  gold = false,
}: {
  children: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <div
      style={{
        border: gold ? `1px solid ${GOLD}20` : "1px solid rgba(255,255,255,0.07)",
        backgroundColor: gold ? `${GOLD}06` : LIFT,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: gold
            ? `linear-gradient(to right, transparent, ${GOLD}30, transparent)`
            : "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function StrategyRoomIntegration() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 82% 18%, rgba(201,169,110,0.09), transparent 38%), radial-gradient(ellipse at 12% 88%, rgba(255,255,255,0.03), transparent 30%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <GoldRule soft />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={TRANSITION}
          >
            <Surface>
              <div className="p-8 md:p-10">
                <Eyebrow>Selective escalation</Eyebrow>

                <h2
                  style={{
                    marginTop: "1.75rem",
                    maxWidth: "13ch",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(2.2rem, 4vw, 4rem)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.94)",
                  }}
                >
                  When interpretation becomes mandate work
                </h2>

                <p
                  style={{
                    marginTop: "1.5rem",
                    maxWidth: "46ch",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.05rem",
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.42)",
                  }}
                >
                  Strategy Room is not the first stop in the system. It is the private chamber for
                  cases that have already crossed from diagnostic clarity into mandate-level
                  consequence.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  <LabelPill>Route discipline</LabelPill>
                  <LabelPill>Mandate fit</LabelPill>
                  <LabelPill>Governed escalation</LabelPill>
                </div>

                <div className="mt-10 space-y-3">
                  {SIGNALS.map((line) => (
                    <div
                      key={line}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: CARD,
                        padding: "1rem",
                      }}
                    >
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: `${GOLD}80` }}
                      />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.96rem",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.62)",
                        }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "1.75rem",
                    border: `1px solid ${GOLD}16`,
                    backgroundColor: `${GOLD}05`,
                    padding: "1.1rem 1.25rem",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4" style={{ color: `${GOLD}78` }} />
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: `${GOLD}88`,
                        }}
                      >
                        Chamber discipline
                      </div>
                      <p
                        style={{
                          marginTop: "0.55rem",
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.95rem",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.50)",
                        }}
                      >
                        The point is not to make the chamber feel exclusive for show. The point is
                        to make escalation feel earned, appropriate, and commercially legitimate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Surface>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ ...TRANSITION, delay: 0.06 }}
          >
            <Surface gold>
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      border: `1px solid ${GOLD}20`,
                      backgroundColor: `${GOLD}0C`,
                      padding: "0.65rem",
                    }}
                  >
                    <Briefcase className="h-5 w-5" style={{ color: `${GOLD}88` }} />
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}
                  >
                    Strategy Room path
                  </div>
                </div>

                <h3
                  style={{
                    marginTop: "1.5rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.8rem, 2.7vw, 2.8rem)",
                    lineHeight: 1.0,
                    letterSpacing: "-0.025em",
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  Structured counsel for live consequence
                </h3>

                <div className="mt-8 space-y-3">
                  {PATHWAYS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        style={{
                          border: "1px solid rgba(255,255,255,0.06)",
                          backgroundColor: CARD,
                          padding: "1rem",
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            style={{
                              border: "1px solid rgba(255,255,255,0.10)",
                              backgroundColor: "rgba(255,255,255,0.03)",
                              padding: "0.55rem",
                              flexShrink: 0,
                            }}
                          >
                            <Icon className="h-4 w-4" style={{ color: `${GOLD}82` }} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "0.95rem",
                                color: "rgba(255,255,255,0.88)",
                                fontWeight: 500,
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                marginTop: "0.3rem",
                                fontSize: "0.92rem",
                                lineHeight: 1.7,
                                color: "rgba(255,255,255,0.56)",
                              }}
                            >
                              {item.body}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {OUTCOMES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        style={{
                          border: "1px solid rgba(255,255,255,0.06)",
                          backgroundColor: CARD,
                          padding: "1rem",
                        }}
                      >
                        <Icon className="h-4 w-4" style={{ color: `${GOLD}82` }} />
                        <div
                          style={{
                            marginTop: "0.75rem",
                            fontSize: "0.95rem",
                            color: "rgba(255,255,255,0.88)",
                            fontWeight: 500,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            marginTop: "0.3rem",
                            fontSize: "0.92rem",
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.55)",
                          }}
                        >
                          {item.body}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    href="/diagnostics/executive-reporting"
                    className={cn(
                      "group inline-flex w-full items-center justify-center gap-3 transition-all duration-300",
                    )}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      padding: "1rem 1.25rem",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.20)";
                      el.style.backgroundColor = "rgba(255,255,255,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.10)";
                      el.style.backgroundColor = "rgba(255,255,255,0.04)";
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "10px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.80)",
                      }}
                    >
                      Review flagship product
                    </span>
                    <FileText className="h-4 w-4 text-white/45 transition-transform group-hover:scale-105 group-hover:text-white/70" />
                  </Link>

                  <Link
                    href="/consulting/strategy-room"
                    className="group inline-flex w-full items-center justify-center gap-3 transition-all duration-300"
                    style={{
                      border: `1px solid ${GOLD}25`,
                      backgroundColor: `${GOLD}08`,
                      padding: "1rem 1.25rem",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = `${GOLD}50`;
                      el.style.backgroundColor = `${GOLD}12`;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = `${GOLD}25`;
                      el.style.backgroundColor = `${GOLD}08`;
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "10px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "#E6C27A",
                      }}
                    >
                      Enter Strategy Room
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: `${GOLD}85` }} />
                  </Link>
                </div>
              </div>
            </Surface>
          </motion.div>
        </div>
      </div>
    </section>
  );
}