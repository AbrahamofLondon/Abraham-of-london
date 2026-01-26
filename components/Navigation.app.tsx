// components/Navigation.app.tsx
import React from "react";
import Header from "@/components/Header";

/**
 * App Navigation Wrapper
 * Simple, safe wrapper for the Header component.
 * No risky logic, no state, no effects - just a pass-through.
 */
export default function NavigationApp() {
  return <Header />;
}

NavigationApp.displayName = "NavigationApp";