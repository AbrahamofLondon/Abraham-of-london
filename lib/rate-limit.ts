export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(identifier)) {
      requests.set(identifier, [now]);
      return false;
    }

    const timestamps = requests.get(identifier)!;
    const recentRequests = timestamps.filter((time) => time > windowStart);

    recentRequests.push(now);
    requests.set(identifier, recentRequests);

    // Clean up old timestamps
    if (recentRequests.length > maxRequests * 2) {
      requests.set(identifier, recentRequests.slice(-maxRequests));
    }

    return recentRequests.length > maxRequests;
  };
}
