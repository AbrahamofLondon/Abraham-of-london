import * as React from "react";
import { motion } from "framer-motion";

type SectionProps = {
  title?: string;
  children: React.ReactNode;
  withContainer?: boolean;
  className?: string;
};

export default function Section({
  title,
  children,
  withContainer = false,
  className = "",
}: SectionProps) {
  return (
    <motion.section
      className={[
        withContainer ? "mx-auto max-w-6xl px-4 py-14" : "px-4 py-14",
        className,
      ].join(" ")}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
    >
      {title && (
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800 md:text-4xl">
          {title}
        </h2>
      )}
      {children}
    </motion.section>
  );
}

Section.displayName = "Section";
