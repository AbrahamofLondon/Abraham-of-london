/* components/WhoIWorkWith.tsx — Compact-ready (12/10) */
import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, Users, Shield, Target, Compass, Sparkles } from "lucide-react";

export interface WhoIWorkWithProps {
  variant?: "dark" | "light";
  className?: string;
  /** compact=true: intended to be embedded inside homepage Panel */
  compact?: boolean;
}

const copy = {
  with: [
    { accent: "The Protectors", text: "Principals who carry real duty—families, teams, institutions—and refuse to outsource responsibility.", icon: Shield },
    { accent: "The Integrators", text: "Leaders who can hold doctrine and data in the same hand—without collapsing either into slogans.", icon: Compass },
    { accent: "The Truth-Seekers", text: "Operators who prefer hard diagnosis over soft affirmation—and can act on what they learn.", icon: Target },
    { accent: "The Architects", text: "Builders focused on endurance: governance, incentives, and legacy that outlives the moment.", icon: Users },
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
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.18 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (reduced: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduced ? { duration: 0.01 } : { duration: 0.75, ease: [0.19, 1, 0.22, 1] as any },
  }),
};

export default function WhoIWorkWith({
  variant = "dark",
  className = "",
  compact = true,
}: WhoIWorkWithProps): JSX.Element {
  const isDark = variant === "dark";
  const ref = React.useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.22 });
  const reducedMotion = useReducedMotion();

  const theme = {
    wrapper: isDark ? "bg-black border-white/10 shadow-xl" : "bg-white border-stone-200 shadow-lg",
    title: isDark ? "text-white" : "text-stone-900",
    body: isDark ? "text-white/70" : "text-stone-600",
    card: isDark ? "bg-black/40 border-white/10" : "bg-stone-50 border-stone-200",
    gold: "text-amber-500",
    goldSoft: isDark ? "text-amber-500/80" : "text-amber-600",
  };

  return (
    <motion.section
      ref={ref as any}
      className={[
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        theme.wrapper,
        className,
      ].join(" ")}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      aria-label="Advisory fit: who we work with and who we do not."
    >
      {/* Texture & light (kept, but reduced density) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={["absolute -top-24 left-1/4 rounded-full blur-[120px]", compact ? "h-[18rem] w-[18rem]" : "h-[28rem] w-[28rem]", isDark ? "bg-amber-500/8" : "bg-amber-500/5"].join(" ")} />
        <div className={["absolute inset-0", compact ? "opacity-[0.06]" : "opacity-[0.08]", isDark ? "bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.1),transparent_60%)]" : "bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.06),transparent_65%)]"].join(" ")} />
        <div className={["absolute inset-0", compact ? "opacity-[0.015]" : "opacity-[0.02]", "bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_10px)]"].join(" ")} />
      </div>

      <div className={["relative z-10", compact ? "p-6 md:p-8" : "p-8 md:p-10 lg:p-12"].join(" ")}>
        {/* Header */}
        <motion.div variants={itemVariants} custom={!!reducedMotion} className={["max-w-2xl", compact ? "mb-8" : "mb-12"].join(" ")}>
          <div className="flex items-center gap-4 mb-4">
            <span className="h-[1px] w-12 bg-amber-500/40" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-amber-500">
              Advisory Fit
            </span>
          </div>

          <h2 className={["font-serif tracking-tight leading-[1.1]", compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl", theme.title].join(" ")}>
            Selective <span className={["italic", theme.gold].join(" ")}>Alignment.</span>
          </h2>

          <p className={["mt-4 font-light leading-relaxed", compact ? "text-sm" : "text-base", theme.body].join(" ")}>
            Outcomes track with partnership quality. We filter for depth, integrity, and the discipline to execute under pressure.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* WITH */}
          <motion.div variants={itemVariants} custom={!!reducedMotion} className="relative group">
            <div className={["h-full rounded-xl border transition-all duration-500", theme.card, "hover:border-amber-500/30 hover:shadow-lg", compact ? "p-6" : "p-8"].join(" ")}>
              <div className={["flex items-center justify-between", compact ? "mb-6" : "mb-8"].join(" ")}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500/10">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500">
                    The Alliance
                  </h3>
                </div>
                <Sparkles className="h-4 w-4 text-amber-500/30" aria-hidden />
              </div>

              <ul className={compact ? "space-y-5" : "space-y-6"}>
                {copy.with.map((item, i) => (
                  <li key={i} className="group/item flex gap-4">
                    <div className="shrink-0 mt-1">
                      <item.icon
                        className={["h-5 w-5 transition-colors duration-300", isDark ? "text-white/35 group-hover/item:text-amber-500" : "text-stone-400 group-hover/item:text-amber-600"].join(" ")}
                        aria-hidden
                      />
                    </div>
                    <div>
                      <span className={["block text-[10px] font-mono uppercase tracking-widest mb-1", theme.goldSoft].join(" ")}>
                        {item.accent}
                      </span>
                      <p className={["leading-relaxed transition-colors", compact ? "text-sm" : "text-sm", isDark ? "text-white/80 group-hover/item:text-white" : "text-stone-700 group-hover/item:text-stone-900"].join(" ")}>
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
            <div className={["h-full rounded-xl border transition-all duration-500", theme.card, "hover:border-rose-500/30 hover:shadow-lg", compact ? "p-6" : "p-8"].join(" ")}>
              <div className={["flex items-center justify-between", compact ? "mb-6" : "mb-8"].join(" ")}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-rose-500/20 flex items-center justify-center bg-rose-500/10">
                    <XCircle className={["h-4 w-4", isDark ? "text-rose-400" : "text-rose-500"].join(" ")} />
                  </div>
                  <h3 className={["font-mono text-[10px] uppercase tracking-[0.3em]", isDark ? "text-rose-400" : "text-rose-500"].join(" ")}>
                    The Divergence
                  </h3>
                </div>
              </div>

              <ul className={compact ? "space-y-4" : "space-y-5"}>
                {copy.notWith.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30 mt-2 shrink-0" aria-hidden />
                    <p className={["leading-relaxed", compact ? "text-sm" : "text-sm", isDark ? "text-white/60" : "text-stone-600"].join(" ")}>
                      {item}
                    </p>
                  </li>
                ))}
              </ul>

              <div className={["mt-8 p-4 rounded-lg border", isDark ? "border-white/10 bg-white/5" : "border-stone-200 bg-stone-100"].join(" ")}>
                <p className={["text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed", isDark ? "text-white/55" : "text-stone-600"].join(" ")}>
                  {copy.footer}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer seal — optional; removed in compact to save space */}
        {!compact && (
          <motion.div variants={itemVariants} custom={!!reducedMotion} className="mt-16 flex flex-col items-center">
            <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent mb-8" />
            <div className="flex items-center gap-10">
              {["London", "Lagos", "Global"].map((x, idx) => (
                <React.Fragment key={x}>
                  <span className={["font-serif text-2xl tracking-[0.05em]", isDark ? "text-white/80 hover:text-amber-500" : "text-stone-700 hover:text-amber-600"].join(" ")}>
                    {x}
                  </span>
                  {idx < 2 && <div className="w-1.5 h-1.5 rotate-45 bg-amber-500/30" aria-hidden />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}