// lib/inner-circle/access.client.ts
export type InnerCircleAccess = {
  hasAccess: boolean;
  reason?: string;
  tier?: string;
};

// Client-side access check (browser only)
export function hasInnerCircleAccess(): boolean {
  if (typeof window === "undefined") {
    throw new Error("hasInnerCircleAccess cannot be called server-side");
  }

  try {
    // Check for access cookie
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("innerCircleAccess="))
      ?.split("=")[1];
    
    // Check localStorage as fallback
    const localStorageAccess = localStorage.getItem("innerCircleAccess");
    
    return cookie === "true" || localStorageAccess === "true";
  } catch {
    return false;
  }
}

// For client-side components to check access
export function checkClientAccess(): InnerCircleAccess {
  const hasAccess = hasInnerCircleAccess();
  
  return {
    hasAccess,
    reason: hasAccess ? undefined : "local_storage",
    tier: hasAccess ? "inner-circle" : undefined,
  };
}