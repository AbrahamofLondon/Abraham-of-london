"use client";

import * as React from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/inner-circle/dashboard", label: "Vault" },
  { href: "/inner-circle/briefs", label: "Briefs" },
  { href: "/diagnostics", label: "Diagnostics" },
  { href: "/consulting/strategy-room", label: "Strategy Room" },
  { href: "/inner-circle/account", label: "Account" },
];

export default function WorkspaceNav() {
  const [currentPath, setCurrentPath] = React.useState("");

  React.useEffect(() => {
    setCurrentPath(window.location.pathname);
    const handler = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backgroundColor: "rgb(6 6 9)",
        flexWrap: "wrap",
      }}
    >
      {NAV_LINKS.map((link) => {
        const isActive =
          currentPath === link.href ||
          (link.href !== "/inner-circle/dashboard" &&
            currentPath.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              padding: "5px 12px",
              border: `1px solid ${isActive ? "rgba(201,169,110,0.40)" : "rgba(255,255,255,0.08)"}`,
              backgroundColor: isActive ? "rgba(201,169,110,0.08)" : "transparent",
              color: isActive ? "#C9A96E" : "rgba(255,255,255,0.38)",
              textDecoration: "none",
              transition: "all 200ms ease",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
