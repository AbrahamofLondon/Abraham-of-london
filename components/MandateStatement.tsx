// components/MandateStatement.tsx
import * as React from "react";
import { motion } from "framer-motion";
import { Shield, Target, Anchor } from "lucide-react";

export default function MandateStatement(): JSX.Element {
  const mandatePoints = [
    {
      icon: Target,
      title: "The Work",
      description: "For men and women who carry real weight — fathers, founders, and board-level leaders."
    },
    {
      icon: Shield,
      title: "The Mission", 
      description: "To build strategies, cultures, and households that stand before God, history, and their own children without shame."
    },
    {
      icon: Anchor,
      title: "The Method",
      description: "Bringing Scripture, hard market reality, and honest governance into the same room. No flattery. No motivational sugar."
    }
  ];

  return (
    <section className="relative my-16 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-charcoal/90 to-charcoal/70 backdrop-blur-sm">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold to-amber-200" />
      
      <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-12">
        {/* Header */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <motion.p 
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold/70 mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="w-8 h-px bg-gold/50"></span>
            The Mandate
            <span className="w-8 h-px bg-gold/50"></span>
          </motion.p>
          
          <motion.h2 
            className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            What I Am Here<br className="hidden sm:block" /> To Do
          </motion.h2>
        </motion.div>

        {/* Core Principles Grid */}
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {mandatePoints.map((point, index) => (
            <motion.div
              key={point.title}
              className="group text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 mb-6 group-hover:border-gold/40 transition-colors">
                <point.icon className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-cream mb-4">
                {point.title}
              </h3>
              <p className="text-sm text-gold/70 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action Text */}
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex flex-col items-center gap-6 px-8 py-8 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
            <p className="text-lg font-semibold text-cream leading-relaxed">
              "If we work together, it is because there is a serious mandate on your life and stewardship — and you are willing to be challenged, not entertained."
            </p>
            <div className="flex items-center gap-3 text-sm text-gold/60">
              <span className="w-12 h-px bg-gold/30"></span>
              Clear thinking • Moral courage • Concrete decisions
              <span className="w-12 h-px bg-gold/30"></span>
            </div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute bottom-6 right-6 opacity-10">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-gold">
            <path d="M40 0L48.5 20L70 20L53.5 32L62 52L40 40L18 52L26.5 32L10 20L31.5 20L40 0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </section>
  );
}