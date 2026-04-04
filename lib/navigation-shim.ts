/* lib/navigation-shim.ts */
import * as NextNavigation from 'next/navigation';

/**
 * SOVEREIGN NAVIGATION SHIM
 * Explicitly exports notFound to bypass build-time type resolution issues 
 * in specific Next.js/TypeScript environments.
 */
export const notFound = (NextNavigation as any).notFound as () => never;

export const useRouter = NextNavigation.useRouter;
export const usePathname = NextNavigation.usePathname;
export const useSearchParams = NextNavigation.useSearchParams;