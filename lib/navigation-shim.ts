/* lib/navigation-shim.ts */
import * as NextNavigation from 'next/navigation';

type RouterShim = {
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
  back?: () => void;
  forward?: () => void;
  prefetch?: (href: string) => Promise<void> | void;
};

/**
 * SOVEREIGN NAVIGATION SHIM
 * Explicitly exports notFound to bypass build-time type resolution issues 
 * in specific Next.js/TypeScript environments.
 */
export const notFound = (NextNavigation as any).notFound as () => never;
export const redirect = (NextNavigation as any).redirect as (href: string) => never;

export const useRouter = (NextNavigation as any).useRouter as () => RouterShim;
export const usePathname = NextNavigation.usePathname;
export const useSearchParams = NextNavigation.useSearchParams;
