// lib/server/rateLimit.d.ts
declare module "@/lib/server/rateLimit" {
  export type NextFn = () => void;

  export type RequestLike = unknown;
  export type ResponseLike = unknown;

  export type RateLimitOptions = {
    interval: number;
    uniqueTokenPerInterval?: number;
  };

  export type Middleware = (req: RequestLike, res: ResponseLike, next: NextFn) => void;

  export function createRateLimitMiddleware(options: RateLimitOptions): Middleware;

  export type AnyFn = (...args: unknown[]) => unknown;

  export function rateLimited<T extends AnyFn>(
    fn: T,
    options?: { interval?: number; uniqueTokenPerInterval?: number }
  ): T;
}