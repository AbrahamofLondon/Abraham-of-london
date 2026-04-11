type MemoryRecord = {
  email: string;
  attempts: number;
  lastRoute: string;
};

const memory = new Map<string, MemoryRecord>();

export function updateMemory(email: string, route: string) {
  const existing = memory.get(email);

  if (!existing) {
    memory.set(email, {
      email,
      attempts: 1,
      lastRoute: route,
    });
    return;
  }

  memory.set(email, {
    email,
    attempts: existing.attempts + 1,
    lastRoute: route,
  });
}

export function getMemory(email: string): MemoryRecord | null {
  return memory.get(email) || null;
}