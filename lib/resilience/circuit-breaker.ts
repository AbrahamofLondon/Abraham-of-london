/* lib/resilience/circuit-breaker.ts */

import { RESILIENCE_CONFIG } from "@/lib/resilience/config";

type CircuitState = {
  failures: number;
  successes: number;
  openedAt: number | null;
  state: "closed" | "open" | "half-open";
};

const circuits = new Map<string, CircuitState>();

function getState(name: string): CircuitState {
  const existing = circuits.get(name);
  if (existing) return existing;

  const fresh: CircuitState = {
    failures: 0,
    successes: 0,
    openedAt: null,
    state: "closed",
  };
  circuits.set(name, fresh);
  return fresh;
}

export function canExecute(name: string): boolean {
  const state = getState(name);

  if (state.state === "closed") return true;

  if (state.state === "open") {
    const now = Date.now();
    const openedAt = state.openedAt || now;
    if (now - openedAt >= RESILIENCE_CONFIG.circuitBreaker.cooldownMs) {
      state.state = "half-open";
      state.successes = 0;
      return true;
    }
    return false;
  }

  return true;
}

export function recordSuccess(name: string) {
  const state = getState(name);

  if (state.state === "half-open") {
    state.successes += 1;
    if (state.successes >= RESILIENCE_CONFIG.circuitBreaker.successThreshold) {
      state.state = "closed";
      state.failures = 0;
      state.successes = 0;
      state.openedAt = null;
    }
    return;
  }

  state.failures = 0;
}

export function recordFailure(name: string) {
  const state = getState(name);
  state.failures += 1;

  if (state.failures >= RESILIENCE_CONFIG.circuitBreaker.failureThreshold) {
    state.state = "open";
    state.openedAt = Date.now();
    state.successes = 0;
  }
}

export async function withCircuitBreaker<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!canExecute(name)) {
    throw new Error(`CIRCUIT_OPEN:${name}`);
  }

  try {
    const result = await fn();
    recordSuccess(name);
    return result;
  } catch (error) {
    recordFailure(name);
    throw error;
  }
}