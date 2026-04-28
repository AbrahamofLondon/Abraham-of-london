import type { DiagnosticAnswers } from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import type { EngineTelemetry, HiddenSignals } from "@/lib/engine/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[], fallback = 0): number {
  if (!values.length) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveHiddenSignals(
  answers: DiagnosticAnswers,
  telemetry?: EngineTelemetry,
): HiddenSignals {
  const entries = Object.values(answers);
  const certaintyValues = entries.map((entry) => entry.certainty);
  const resonanceValues = entries.map((entry) => entry.resonance);
  const timings = Object.values(telemetry?.questionTimingsMs ?? {}).filter((value) =>
    Number.isFinite(value),
  );

  const contradictionDensity = clamp(
    average(
      entries.map((entry) => Math.abs(entry.resonance - 5) <= 1 && entry.certainty >= 7 ? 1 : 0),
    ),
    0,
    1,
  );

  const hesitationIndex = clamp(
    average(timings, 0) / 12000,
    0,
    1,
  );

  const certaintyCompression = clamp(
    1 - Math.min(1, (Math.max(...certaintyValues, 0) - Math.min(...certaintyValues, 10)) / 10),
    0,
    1,
  );

  const narrativeDrift = clamp(
    average(
      entries.map((entry, index) => {
        const previous = resonanceValues[index - 1] ?? entry.resonance;
        return Math.abs(previous - entry.resonance) / 10;
      }),
    ),
    0,
    1,
  );

  return {
    contradictionDensity,
    hesitationIndex,
    certaintyCompression,
    narrativeDrift,
  };
}
