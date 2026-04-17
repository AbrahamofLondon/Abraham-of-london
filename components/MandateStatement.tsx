// components/MandateStatement.tsx
import * as React from "react";
import { motion } from "framer-motion";

const GOLD = "#C9A96E";

export default function MandateStatement(): JSX.Element {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderTop: `1px solid ${GOLD}1A`,
        borderBottom: `1px solid ${GOLD}1A`,
        backgroundColor: "rgba(201,169,110,0.04)",
        padding: "3.5rem 2.5rem",
      }}
    >
      {/* Top thread */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 1,
          background: `linear-gradient(to right,
            transparent, ${GOLD}28, transparent)`,
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.75rem",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 1,
            height: 20,
            backgroundColor: `${GOLD}55`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.44em",
            textTransform: "uppercase",
            color: `${GOLD}99`,
          }}
        >
          Mandate
        </span>
      </div>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.6,
          ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily:
            "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
          fontWeight: 300,
          fontStyle: "italic",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.92)",
          marginBottom: "2rem",
          maxWidth: "42ch",
        }}
      >
        What I am actually here to do
      </motion.h2>

      {/* Gold rule */}
      <div
        style={{
          width: 40,
          height: 1,
          backgroundColor: `${GOLD}44`,
          marginBottom: "2rem",
        }}
      />

      {/* Body paragraphs */}
      {[
        `My work is for men and women who carry real weight — fathers, founders, and board-level leaders. The mandate is simple: to help them build strategies, cultures, and households that will stand before God, history, and their own children without shame.`,
        `That means bringing Scripture, hard market reality, and honest governance into the same room. No flattery. No motivational sugar. Just clear thinking, moral courage, and concrete decisions that respect both calling and consequence.`,
        `If we work together, it is because there is a serious mandate on your life and stewardship — and you are willing to be challenged, not entertained.`,
      ].map((para, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1,
            duration: 0.55 }}
          style={{
            fontFamily:
              "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.0625rem",
            fontWeight: 300,
            lineHeight: 1.85,
            color: "rgba(255,255,255,0.55)",
            maxWidth: "62ch",
            marginBottom: i < 2 ? "1.25rem" : 0,
          }}
        >
          {para}
        </motion.p>
      ))}

      {/* Bottom thread */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          height: 1,
          background: `linear-gradient(to right,
            transparent, rgba(255,255,255,0.04),
            transparent)`,
        }}
      />
    </motion.section>
  );
}