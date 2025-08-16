// components/homepage/TestimonialsSection.tsx
import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Testimonial = { quote: string; name: string; role: string };

const items: Testimonial[] = [
  {
    quote: "Practical, grounded leadership insights I could apply the same day.",
    name: "Ohis O.",
    role: "SAP Consultant",
  },
  {
    quote: "A sensible voice on fatherhood that is both thoughtful and actionable.",
    name: "Emilia I.",
    role: "Manager",
  },
  {
    quote: "Clear frameworks that helped our team align on goals and execution.",
    name: "Lanre",
    role: "Consultant",
  },
];

export default function TestimonialsSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 px-4" aria-label="Testimonials">
      <div className="container mx-auto max-w-6xl">
        {/* High-contrast white surface for readability */}
        <div className="bg-white text-deepCharcoal rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12">
          <motion.h2
            className="text-3xl md:text-4xl font-serif font-bold text-center mb-10"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            What readers say
          </motion.h2>

          <div className="grid gap-6 md:grid-cols-3">
            {items.map((t, i) => (
              <motion.blockquote
                key={`${t.name}-${t.role}-${i}`}
                className="rounded-2xl bg-white ring-1 ring-black/10 shadow-md p-6"
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45 }}
              >
                <p className="text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-sm text-deepCharcoal/70">
                  <span className="font-semibold text-deepCharcoal">{t.name}</span>
                  <span className="px-2" aria-hidden="true">·</span>
                  <span>{t.role}</span>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
