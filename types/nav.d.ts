// types/nav.d.ts

declare interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  icon?: string;
  description?: string;
  badge?: string;
  children?: NavItem[];
}

declare interface NavigationConfig {
  main: NavItem[];
  sidebar?: NavItem[];
  footer: {
    navigation: NavItem[];
    social?: Array<{
      name: string;
      href: string;
      icon: string;
    }>;
  };
}

declare interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

declare interface Pagination {
  current: number;
  total: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Router types for Next.js navigation
declare module "next/navigation" {
  export interface useRouter {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (href: string) => void;
  }
}

// Extended Document for navigation helpers
declare interface Document {
  nav?: {
    currentPath: string;
    previousPath: string;
    history: string[];
  };
}
