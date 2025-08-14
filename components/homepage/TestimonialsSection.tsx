import React from "react";
import { motion } from "framer-motion";

type Testimonial = { quote: string; name: string; role: string };

const items: Testimonial[] = [
  {
    quote:
      "Practical, grounded leadership insights I could apply the same day.",
    name: "Ohis O,.",
    role: "SAP Consultant",
  },
  {
    quote:
      "A rare voice on fatherhood that is both thoughtful and actionable.",
    name: "Maya L.",
    role: "Editor",
  },
  {
    quote:
      "Clear frameworks that helped our team align on goals and execution.",
    name: "Lanre.",
    role: "Mother",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="container px-4 py-16">
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-cream text-center mb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        What readers say
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((t, i) => (
          <motion.blockquote
            key={i}
            className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-6 text-cream shadow-card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <p className="text-base leading-relaxed">"{t.quote}"</p>
            <footer className="mt-4 text-sm text-cream/80">
              <span className="font-semibold text-cream">{t.name}</span>
              <span className="text-cream/60"> — {t.role}</span>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
