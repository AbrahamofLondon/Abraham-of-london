// components/WhoIWorkWith.tsx — THE HARRODS EDIT (Institutional Luxury)
import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, Users, Shield, Target, Compass, Sparkles } from "lucide-react";

export interface WhoIWorkWithProps {
  variant?: "dark" | "light";
  className?: string;
}

const copy = {
  with: [
    {
      accent: "The Protectors",
      text: "Principals who carry real duty—families, teams, institutions—and refuse to outsource responsibility.",
      icon: Shield,
    },
    {
      accent: "The Integrators",
      text: "Leaders who can hold doctrine and data in the same hand—without collapsing either into slogans.",
      icon: Compass,
    },
    {
      accent: "The Truth-Seekers",
      text: "Operators who prefer hard diagnosis over soft affirmation—and can act on what they learn.",
      icon: Target,
    },
    {
      accent: "The Architects",
      text: "Builders focused on endurance: governance, incentives, and legacy that outlives the moment.",
      icon: Users,
    },
  ],
  notWith: [
    "Performative strategy: hype decks, cosmetic rebrands, and momentum theatre.",
    "Validation-seeking leadership: comfort over accountability, applause over outcomes.",
    "Cultures allergic to reality: no appetite for constraints, trade-offs, or consequences.",
    "Integrity-as-a-tool thinking: when principle is treated as optional, advisory becomes malpractice.",
  ],
  footer: "Advisory is finite. We reserve it for missions that require precision, integrity, and execution.",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.18 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (reduced: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduced
      ? { duration: 0.01 }
      : { duration: 0.75, ease: [0.19, 1, 0.22, 1] as any },
  }),
};

export default function WhoIWorkWith({
  variant = "dark",
  className = "",
}: WhoIWorkWithProps): JSX.Element {
  const isDark = variant === "dark";
  const ref = React.useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.22 });
  const reducedMotion = useReducedMotion();

  const theme = {
    wrapper: isDark
      ? "bg-[#050505] border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.55)]"
      : "bg-[#F9F8F6] border-stone-200 shadow-[0_0_40px_-15px_rgba(0,0,0,0.12)]",
    title: isDark ? "text-white/95" : "text-stone-900",
    body: isDark ? "text-white/55" : "text-stone-600",
    card: isDark ? "bg-white/[0.01] border-white/[0.06]" : "bg-white border-stone-100",
    gold: "text-[#D4AF37]",
    goldSoft: isDark ? "text-[#D4AF37]/70" : "text-[#8a6f20]",
    roseSoft: isDark ? "text-rose-300/55" : "text-rose-700/70",
  };

  return (
    <motion.section
      ref={ref as any}
      className={[
        "relative overflow-hidden rounded-[2rem] border backdrop-blur-xl",
        theme.wrapper,
        className,
      ].join(" ")}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      aria-label="Advisory fit: who we work with and who we do not."
    >
      {/* Texture & light (no external assets) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gold bloom */}
        <div
          className={[
            "absolute -top-24 left-1/4 h-[28rem] w-[28rem] rounded-full blur-[120px]",
            isDark ? "bg-[#D4AF37]/6" : "bg-[#D4AF37]/10",
          ].join(" ")}
        />
        {/* Top highlight */}
        <div
          className={[
            "absolute inset-0 opacity-[0.12]",
            isDark
              ? "bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.14),transparent_60%)]"
              : "bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_65%)]",
          ].join(" ")}
        />
        {/* Subtle grain (CSS-only, institutional-safe) */}
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(0deg,rgba(255,255,255,0.0),rgba(255,255,255,0.0)),repeating-linear-gradient(90deg,rgba(255,255,255,0.10)_0,rgba(255,255,255,0.10)_1px,transparent_1px,transparent_7px)]" />
      </div>

      <div className="relative z-10 p-8 md:p-10 lg:p-12">
        {/* Header */}
        <motion.div variants={itemVariants} custom={!!reducedMotion} className="max-w-2xl mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="h-[1px] w-12 bg-[#D4AF37]/40" />
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-[#D4AF37]">
              Advisory Fit
            </span>
          </div>

          <h2 className={["font-serif text-3xl md:text-4xl tracking-tight leading-[1.1]", theme.title].join(" ")}>
            Selective <span className={["italic", theme.gold].join(" ")}>Alignment.</span>
          </h2>

          <p className={["mt-4 text-sm md:text-base font-light leading-relaxed", theme.body].join(" ")}>
            Outcomes track with partnership quality. We filter for depth, integrity, and the discipline to execute under pressure.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* WITH */}
          <motion.div variants={itemVariants} custom={!!reducedMotion} className="relative group">
            <div
              className={[
                "h-full rounded-2xl border p-8 transition-all duration-700",
                theme.card,
                "hover:-translate-y-[2px] hover:border-[#D4AF37]/30",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[#D4AF37]/20 flex items-center justify-center bg-[#D4AF37]/5">
                    <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
                    The Alliance
                  </h3>
                </div>
                <Sparkles className="h-4 w-4 text-[#D4AF37]/20" aria-hidden />
              </div>

              <ul className="space-y-6">
                {copy.with.map((item, i) => (
                  <li key={i} className="group/item flex gap-5">
                    <div className="shrink-0 mt-1">
                      <item.icon
                        className={[
                          "h-5 w-5 transition-colors duration-500",
                          isDark ? "text-white/20 group-hover/item:text-[#D4AF37]" : "text-stone-400 group-hover/item:text-[#8a6f20]",
                        ].join(" ")}
                        aria-hidden
                      />
                    </div>
                    <div>
                      <span className={["block text-[9px] font-mono uppercase tracking-widest mb-1", theme.goldSoft].join(" ")}>
                        {item.accent}
                      </span>
                      <p
                        className={[
                          "text-sm leading-relaxed transition-colors",
                          isDark ? "text-white/70 group-hover/item:text-white" : "text-stone-700 group-hover/item:text-stone-900",
                        ].join(" ")}
                      >
                        {item.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* NOT WITH */}
          <motion.div variants={itemVariants} custom={!!reducedMotion} className="relative group">
            <div
              className={[
                "h-full rounded-2xl border p-8 transition-all duration-700",
                theme.card,
                "hover:-translate-y-[2px] hover:border-rose-900/25",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-rose-500/10 flex items-center justify-center bg-rose-500/5">
                    <XCircle className={["h-4 w-4", theme.roseSoft].join(" ")} />
                  </div>
                  <h3 className={["font-mono text-[10px] uppercase tracking-[0.3em]", theme.roseSoft].join(" ")}>
                    The Divergence
                  </h3>
                </div>
              </div>

              <ul className="space-y-5">
                {copy.notWith.map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500/20 mt-2 shrink-0" aria-hidden />
                    <p className={["text-sm leading-relaxed italic font-light", isDark ? "text-white/45" : "text-stone-600"].join(" ")}>
                      {item}
                    </p>
                  </li>
                ))}
              </ul>

              <div className={["mt-12 p-4 rounded-xl border", isDark ? "border-white/[0.04] bg-white/[0.01]" : "border-stone-100 bg-stone-50"].join(" ")}>
                <p className={["text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed", isDark ? "text-white/35" : "text-stone-500"].join(" ")}>
                  {copy.footer}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer seal */}
        <motion.div variants={itemVariants} custom={!!reducedMotion} className="mt-16 flex flex-col items-center">
          <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-[#D4AF37]/40 to-transparent mb-8" />
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-10">
              {["London", "Lagos", "Global"].map((x, idx) => (
                <React.Fragment key={x}>
                  <span
                    className={[
                      "font-serif text-xl md:text-2xl tracking-[0.05em] transition-colors duration-500 cursor-default",
                      isDark ? "text-white/90 hover:text-[#D4AF37]" : "text-stone-800 hover:text-[#8a6f20]",
                    ].join(" ")}
                  >
                    {x}
                  </span>
                  {idx < 2 && <div className="w-1.5 h-1.5 rounded-full border border-[#D4AF37]/30 rotate-45" aria-hidden />}
                </React.Fragment>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-px w-12 bg-[#D4AF37]/20" />
              <p className="sr-only">Geographic axis: London, Lagos, Global.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}