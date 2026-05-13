import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const GOLD = "#C9A96E";
export const BG = "rgb(3,3,5)";
export const WHITE = "rgba(255,255,255,0.93)";
export const DIM = "rgba(255,255,255,0.68)";
export const FAINT = "rgba(255,255,255,0.40)";

const SMOOTH: React.CSSProperties = {
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

export const serif: React.CSSProperties = {
  fontFamily: "Georgia, 'Palatino Linotype', 'Times New Roman', serif",
  fontWeight: 300,
  ...SMOOTH,
};

export const mono: React.CSSProperties = {
  fontFamily: "Consolas, 'SF Mono', 'Fira Code', 'Courier New', monospace",
  fontWeight: 400,
  ...SMOOTH,
};

// ── Scene-level opacity envelope ──────────────────────────────────────────────
// Uses scene-local durationInFrames (prop) — NOT useVideoConfig which returns
// the full composition total, not the active sequence duration.

export function SceneEnvelope({
  children,
  durationInFrames,
  fadeDuration = 22,
}: {
  children: React.ReactNode;
  durationInFrames: number;
  fadeDuration?: number;
}) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, fadeDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fadeDuration, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.sin),
    }
  );
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
}

// ── Slow push-in still ────────────────────────────────────────────────────────
// Zoom restrained to 1.06 max. Sine ease-in-out removes mechanical linearity —
// the world breathes toward camera rather than advancing at a fixed rate.

export function CinematicStill({
  src,
  durationInFrames,
  zoomTo = 1.05,
  xDrift = 0,
  yDrift = 0,
}: {
  src: string;
  durationInFrames: number;
  zoomTo?: number;
  xDrift?: number;
  yDrift?: number;
}) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1.0, zoomTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const t = durationInFrames > 0 ? frame / durationInFrames : 0;
  const easedT = Easing.inOut(Easing.sin)(t);
  const tx = xDrift * easedT;
  const ty = yDrift * easedT;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
}

// ── Gold hair-rule accent ─────────────────────────────────────────────────────
// A single pixel of intention. Fades in and breathes with a slow sine cycle.

export function GoldAccent({
  position = "bottom",
  delay = 30,
}: {
  position?: "top" | "bottom";
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [delay, delay + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  const pulse = 0.82 + 0.18 * Math.sin(frame / 50);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 60 }}>
      <div
        style={{
          position: "absolute",
          [position]: "16%",
          left: "6%",
          right: "6%",
          height: "1px",
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(201,169,110,${0.22 * pulse}) 15%,
            rgba(201,169,110,${0.52 * pulse}) 40%,
            rgba(201,169,110,${0.60 * pulse}) 50%,
            rgba(201,169,110,${0.52 * pulse}) 60%,
            rgba(201,169,110,${0.22 * pulse}) 85%,
            transparent 100%)`,
          opacity: appear,
        }}
      />
    </AbsoluteFill>
  );
}

// ── Threshold light pulse ─────────────────────────────────────────────────────
// Organic double-sine breath — two overlapping rhythms feel alive, not
// mechanical. Used for refusal gate (S06) and operator pilot (S10).

export function ThresholdPulse({ delay = 30 }: { delay?: number }) {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [delay, delay + 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  const f = frame - delay;
  const breathe = Math.max(
    0,
    0.30 + 0.42 * Math.sin(f / 52) + 0.28 * Math.sin(f / 79 + 1.1)
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 55 }}>
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "25%",
          right: "25%",
          bottom: "20%",
          background: `radial-gradient(ellipse at center,
            rgba(201,169,110,${0.11 * breathe}) 0%,
            rgba(201,169,110,${0.04 * breathe}) 40%,
            transparent 72%)`,
          opacity: appear,
        }}
      />
    </AbsoluteFill>
  );
}

// ── Fade element ──────────────────────────────────────────────────────────────

export function FadeText({
  children,
  delay = 0,
  duration = 25,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  return <div style={{ opacity, ...style }}>{children}</div>;
}

// ── Dark text panel ───────────────────────────────────────────────────────────

export function TextPanel({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  return (
    <div
      style={{
        opacity,
        background: "rgba(3,3,5,0.86)",
        border: `1px solid rgba(201,169,110,0.18)`,
        padding: "22px 34px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Sequential list item ──────────────────────────────────────────────────────

export function SeqItem({
  label,
  delay,
  useMono = false,
  size = "22px",
  color = DIM,
}: {
  label: string;
  delay: number;
  useMono?: boolean;
  size?: string;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginBottom: "14px",
      }}
    >
      <span
        style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          backgroundColor: GOLD,
          flexShrink: 0,
          opacity: 0.90,
        }}
      />
      <span
        style={{
          ...(useMono ? mono : serif),
          fontSize: size,
          color,
          letterSpacing: useMono ? "0.08em" : "0.02em",
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Corridor stage label ──────────────────────────────────────────────────────
// Active stage glows gold; prior stages dim to 0.28 opacity.

export function CorridorStage({
  label,
  delay,
  active = false,
}: {
  label: string;
  delay: number;
  active?: boolean;
}) {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  const glow = active
    ? interpolate(frame, [delay + 8, delay + 28], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.sin),
      })
    : 0;

  return (
    <div
      style={{
        opacity: appear,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: active ? GOLD : "rgba(255,255,255,0.15)",
          border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.10)"}`,
          boxShadow: active
            ? `0 0 ${10 * glow}px ${4 * glow}px rgba(201,169,110,0.45)`
            : "none",
          transition: "none",
        }}
      />
      <span
        style={{
          ...mono,
          fontSize: "17px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: active ? GOLD : "rgba(255,255,255,0.42)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Institutional separator rule ──────────────────────────────────────────────
// Single gold pixel separating brand tiers in the closing plate.

export function GoldRule({ delay = 0 }: { delay?: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.sin),
  });
  const width = interpolate(frame, [delay, delay + 45], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <div
      style={{
        opacity,
        height: "1px",
        width: `${width}%`,
        margin: "22px auto",
        background: `linear-gradient(90deg,
          transparent 0%,
          rgba(201,169,110,0.50) 30%,
          rgba(201,169,110,0.65) 50%,
          rgba(201,169,110,0.50) 70%,
          transparent 100%)`,
      }}
    />
  );
}
