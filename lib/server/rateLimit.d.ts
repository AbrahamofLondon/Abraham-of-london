// lib/server/rateLimit.d.ts
declare module "@/lib/server/rateLimit" {
  export function createRateLimitMiddleware(options: {
    interval: number;
    uniqueTokenPerInterval?: number;
  }): (req: any, res: any, next: () => void) => void;
  
  export function rateLimited(
    fn: Function,
    options?: { interval?: number; uniqueTokenPerInterval?: number }
  ): Function;
}
