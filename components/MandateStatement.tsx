// components/MandateStatement.tsx
import * as React from "react";
import { motion } from "framer-motion";

export default function MandateStatement(): JSX.Element {
  return (
    <motion.section
      className="my-16 rounded-2xl border border-gold/25 bg-charcoal/70 px-6 py-8 sm:px-10 sm:py-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.p
        className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gold/70"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        Mandate
      </motion.p>

      <motion.h2
        className="mt-3 font-serif text-2xl font-semibold text-cream sm:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        viewport={{ once: true }}
      >
        What I am actually here to do
      </motion.h2>

      <motion.p
        className="mt-4 text-sm leading-relaxed text-gold/75 sm:text-base"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        viewport={{ once: true }}
      >
        My work is for men and women who carry real weight - fathers, founders,
        and board-level leaders. The mandate is simple: to help them build
        strategies, cultures, and households that will stand before God,
        history, and their own children without shame.
      </motion.p>

      <motion.p
        className="mt-4 text-sm leading-relaxed text-gold/75 sm:text-base"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        viewport={{ once: true }}
      >
        That means bringing Scripture, hard market reality, and honest
        governance into the same room. No flattery. No motivational sugar. Just
        clear thinking, moral courage, and concrete decisions that respect both
        calling and consequence.
      </motion.p>

      <motion.p
        className="mt-4 text-sm leading-relaxed text-gold/75 sm:text-base"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        viewport={{ once: true }}
      >
        If we work together, it is because there is a serious mandate on your
        life and stewardship - and you are willing to be challenged, not
        entertained.
      </motion.p>
    </motion.section>
  );
}
