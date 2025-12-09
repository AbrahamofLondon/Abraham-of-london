// types/linkitem-utils.ts

/**
 * Utility functions for working with LinkItem objects
 */

// Type guards
export const isLinkItem = (obj: unknown): obj is LinkItem => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "href" in obj &&
    "label" in obj &&
    typeof (obj as LinkItem).href === "string" &&
    typeof (obj as LinkItem).label === "string"
  );
};

export const isExternalLink = (link: LinkItem): boolean => {
  return (
    link.external === true ||
    link.href.startsWith("http") ||
    link.href.startsWith("//")
  );
};

export const isInternalLink = (link: LinkItem): boolean => {
  return !isExternalLink(link);
};

export const hasSubtitle = (
  link: LinkItem
): link is LinkItem & { sub: string } => {
  return !!link.sub;
};

export const hasIcon = (
  link: LinkItem
): link is LinkItem & { icon: string } => {
  return !!link.icon;
};

export const hasBadge = (
  link: LinkItem
): link is LinkItem & { badge: string } => {
  return !!link.badge;
};

export const hasChildren = (
  link: LinkItem
): link is LinkItem & { children: LinkItem[] } => {
  return !!link.children && link.children.length > 0;
};

// Factory functions
export const createLinkItem = (
  overrides: Partial<LinkItem> & { href: string; label: string }
): LinkItem => ({
  external: overrides.href?.startsWith("http") ? true : undefined,
  ...overrides,
});

export const createExternalLink = (
  href: string,
  label: string,
  options?: Partial<LinkItem>
): LinkItem => ({
  href,
  label,
  external: true,
  rel: "noopener noreferrer",
  ...options,
});

export const createInternalLink = (
  href: string,
  label: string,
  options?: Partial<LinkItem>
): LinkItem => ({
  href,
  label,
  external: false,
  prefetch: true,
  ...options,
});

// Validation
export const validateLinkItem = (link: LinkItem): string[] => {
  const errors: string[] = [];

  if (!link.href.trim()) {
    errors.push("Link href is required");
  }

  if (!link.label.trim()) {
    errors.push("Link label is required");
  }

  if (link.external && !link.href.startsWith("http")) {
    errors.push("External links must start with http:// or https://");
  }

  if (
    link.priority !== undefined &&
    (link.priority < 0 || !Number.isInteger(link.priority))
  ) {
    errors.push("Priority must be a non-negative integer");
  }

  return errors;
};

// Transformation utilities
export const withDefaultRel = (link: LinkItem): LinkItem => {
  if (link.external && !link.rel) {
    return { ...link, rel: "noopener noreferrer" };
  }
  return link;
};

export const withAnalytics = (link: LinkItem, eventName: string): LinkItem => {
  return { ...link, analyticsEvent: eventName };
};

export const withBadge = (
  link: LinkItem,
  badge: string,
  variant: LinkItem["badgeVariant"] = "default"
): LinkItem => {
  return { ...link, badge, badgeVariant: variant };
};

export const withIcon = (link: LinkItem, icon: string): LinkItem => {
  return { ...link, icon };
};

// Filtering and searching
export const filterLinksByGroup = (
  links: LinkItem[],
  group: string
): LinkItem[] => {
  return links.filter((link) => link.group === group);
};

export const filterEnabledLinks = (links: LinkItem[]): LinkItem[] => {
  return links.filter(
    (link) => !link.disabled && (link.condition ? link.condition() : true)
  );
};

export const sortLinksByPriority = (links: LinkItem[]): LinkItem[] => {
  return links.sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

export const searchLinks = (links: LinkItem[], query: string): LinkItem[] => {
  const lowerQuery = query.toLowerCase();
  return links.filter(
    (link) =>
      link.label.toLowerCase().includes(lowerQuery) ||
      link.sub?.toLowerCase().includes(lowerQuery) ||
      link.href.toLowerCase().includes(lowerQuery)
  );
};

// Navigation helpers
export const getActiveLink = (
  links: LinkItem[],
  currentPath: string
): LinkItem | undefined => {
  return links.find(
    (link) =>
      link.href === currentPath ||
      (link.href !== "/" && currentPath.startsWith(link.href))
  );
};

export const flattenLinkTree = (links: LinkItem[]): LinkItem[] => {
  const flattened: LinkItem[] = [];

  const flatten = (items: LinkItem[]) => {
    items.forEach((item) => {
      flattened.push(item);
      if (item.children) {
        flatten(item.children);
      }
    });
  };

  flatten(links);
  return flattened;
};

export const getBreadcrumbs = (
  links: LinkItem[],
  currentPath: string
): LinkItem[] => {
  const flattened = flattenLinkTree(links);
  const pathSegments = currentPath.split("/").filter(Boolean);
  const breadcrumbs: LinkItem[] = [];
  let currentSegment = "";

  // Always include home
  const homeLink = flattened.find((link) => link.href === "/");
  if (homeLink) {
    breadcrumbs.push({ ...homeLink, current: false });
  }

  pathSegments.forEach((segment) => {
    currentSegment += `/${segment}`;
    const link = flattened.find((l) => l.href === currentSegment);
    if (link) {
      breadcrumbs.push({ ...link, current: currentSegment === currentPath });
    }
  });

  return breadcrumbs;
};
