// components/Navigation.app.tsx
import React from "react";
import Header from "@/components/Header";

interface NavigationAppProps {
  // Add any props that Header might need in the future
  // For now, it's empty
}

/**
 * App Navigation Wrapper
 * Simple, safe wrapper for the Header component.
 * No risky logic, no state, no effects - just a pass-through.
 * 
 * This component is designed to be used as a layout wrapper
 * in App Router contexts while maintaining compatibility with
 * Pages Router components.
 */
export default function NavigationApp({}: NavigationAppProps) {
  return <Header />;
}

NavigationApp.displayName = "NavigationApp";