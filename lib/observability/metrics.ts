/* lib/observability/metrics.ts */

type CounterMap = Map<string, number>;
type GaugeMap = Map<string, number>;

const counters: CounterMap = new Map();
const gauges: GaugeMap = new Map();

function key(name: string, tags?: Record<string, string | number | boolean>) {
  const suffix = tags
    ? ":" +
      Object.entries(tags)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(",")
    : "";
  return `${name}${suffix}`;
}

export function increment(name: string, value = 1, tags?: Record<string, string | number | boolean>) {
  const k = key(name, tags);
  counters.set(k, (counters.get(k) || 0) + value);
}

export function gauge(name: string, value: number, tags?: Record<string, string | number | boolean>) {
  gauges.set(key(name, tags), value);
}

export function snapshotMetrics() {
  return {
    counters: Object.fromEntries(counters.entries()),
    gauges: Object.fromEntries(gauges.entries()),
    collectedAt: new Date().toISOString(),
  };
}