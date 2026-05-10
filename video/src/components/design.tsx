/**
 * Shared design system for the video.
 * Matches Abraham of London institutional aesthetic.
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

// ── TOKENS ──
// Video requires higher contrast and larger text than web.
// Minimum readable font size in 1080p video: 18px.
// Minimum contrast for secondary text: 60% white.
export const BG = "rgb(3,3,5)";
export const GOLD = "#C9A96E";
export const WHITE = "rgba(255,255,255,0.95)";
export const DIM = "rgba(255,255,255,0.70)";
export const FAINT = "rgba(255,255,255,0.45)";
export const AMBER_GLOW = "rgba(201,169,110,0.12)";

export const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  fontWeight: 300,
};

export const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};

// ── FULL SCREEN CONTAINER ──
export function Frame({ children, bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bg ?? BG,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 120px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ── FADE IN ──
export function FadeIn({
  children,
  delay = 0,
  duration = 20,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + duration], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

// ── WORD REVEAL (one word at a time) ──
export function WordReveal({
  words,
  startFrame = 0,
  interval = 25,
  style,
}: {
  words: string[];
  startFrame?: number;
  interval?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", gap: "60px", flexWrap: "wrap", justifyContent: "center", ...style }}>
      {words.map((word, i) => {
        const wordStart = startFrame + i * interval;
        const opacity = interpolate(frame, [wordStart, wordStart + 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={word}
            style={{
              ...serif,
              fontSize: "52px",
              fontStyle: "italic",
              color: GOLD,
              opacity,
              letterSpacing: "0.04em",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

// ── EYEBROW LABEL ──
export function Eyebrow({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <FadeIn delay={delay} duration={15}>
      <p
        style={{
          ...mono,
          fontSize: "18px",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: GOLD,
        }}
      >
        {children}
      </p>
    </FadeIn>
  );
}

// ── HEADLINE ──
export function Headline({
  children,
  delay = 0,
  size = "48px",
  color,
  maxWidth,
}: {
  children: React.ReactNode;
  delay?: number;
  size?: string;
  color?: string;
  maxWidth?: string;
}) {
  return (
    <FadeIn delay={delay} duration={20}>
      <h1
        style={{
          ...serif,
          fontSize: size,
          fontStyle: "italic",
          lineHeight: 1.1,
          color: color ?? WHITE,
          maxWidth: maxWidth ?? "900px",
          textAlign: "center",
        }}
      >
        {children}
      </h1>
    </FadeIn>
  );
}

// ── BODY TEXT ──
export function Body({
  children,
  delay = 0,
  color,
  maxWidth,
}: {
  children: React.ReactNode;
  delay?: number;
  color?: string;
  maxWidth?: string;
}) {
  return (
    <FadeIn delay={delay} duration={18}>
      <p
        style={{
          ...serif,
          fontSize: "24px",
          lineHeight: 1.65,
          color: color ?? DIM,
          maxWidth: maxWidth ?? "700px",
          textAlign: "center",
        }}
      >
        {children}
      </p>
    </FadeIn>
  );
}

// ── SYSTEM TEXT (monospace, small) ──
export function SystemText({
  children,
  delay = 0,
  color,
}: {
  children: React.ReactNode;
  delay?: number;
  color?: string;
}) {
  return (
    <FadeIn delay={delay} duration={15}>
      <p
        style={{
          ...mono,
          fontSize: "20px",
          letterSpacing: "0.12em",
          color: color ?? FAINT,
          textAlign: "center",
        }}
      >
        {children}
      </p>
    </FadeIn>
  );
}

// ── CORRIDOR NODE ──
export function CorridorNode({
  label,
  active,
  delay = 0,
}: {
  label: string;
  active?: boolean;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: active ? GOLD : "rgba(255,255,255,0.15)",
          border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.10)"}`,
        }}
      />
      <span
        style={{
          ...mono,
          fontSize: "14px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: active ? GOLD : "rgba(255,255,255,0.50)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── CORRIDOR CONNECTOR LINE ──
export function CorridorLine({ delay = 0 }: { delay?: number }) {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [delay, delay + 15], [0, 60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        height: "1px",
        width: `${width}px`,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginTop: "-18px",
      }}
    />
  );
}

// ── COLUMN LIST (3 cols with items) ──
export function ThreeColumns({
  columns,
  startDelay = 0,
}: {
  columns: Array<{ header: string; items: string[] }>;
  startDelay?: number;
}) {
  return (
    <div style={{ display: "flex", gap: "40px" }}>
      {columns.map((col, ci) => (
        <FadeIn key={col.header} delay={startDelay + ci * 20} duration={18}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "28px 32px",
              width: "280px",
            }}
          >
            <p style={{ ...mono, fontSize: "18px", letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD }}>
              {col.header}
            </p>
            {col.items.map((item, ii) => (
              <FadeIn key={item} delay={startDelay + ci * 20 + (ii + 1) * 12}>
                <p style={{ ...serif, fontSize: "22px", lineHeight: 1.5, color: DIM, marginTop: "12px" }}>
                  {item}
                </p>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

// ── BULLET LIST ──
export function BulletList({
  items,
  startDelay = 0,
  interval = 18,
  color,
}: {
  items: string[];
  startDelay?: number;
  interval?: number;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
      {items.map((item, i) => (
        <FadeIn key={item} delay={startDelay + i * interval}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ ...mono, fontSize: "18px", color: GOLD }}>—</span>
            <span style={{ ...serif, fontSize: "24px", lineHeight: 1.5, color: color ?? DIM }}>{item}</span>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
