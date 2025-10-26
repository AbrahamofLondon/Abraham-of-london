"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type NavItem = { href: string; label: string };

const nav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },   // prefer no trailing slash for consistency
  { href: "/contact", label: "Contact" }
];

type HrefKind = "internal" | "hash" | "mailto" | "tel" | "external";

const classifyHref = (href: string): HrefKind => {
  if (href.startsWith("#")) return "hash";
  if (href.startsWith("mailto:")) return "mailto";
  if (href.startsWith("tel:")) return "tel";
  if (/^https?:\/\//i.test(href)) return "external";
  return "internal";
};

const normalizePath = (p: string) => {
  // remove trailing slash except for root
  if (p.length > 1 && p.endsWith("/")) return p.replace(/\/+$/, "");
  return p;
};

export default function InteractiveElements() {
  const { asPath } = useRouter();
  const current = normalizePath(asPath.split("#")[0] || "/");

  return (
    <nav className="flex flex-col gap-2" aria-label="Primary">
      {nav.map((item) => {
        const kind = classifyHref(item.href);
        const isActive =
          kind === "internal" &&
          normalizePath(item.href) === current;

        if (kind === "internal" || kind === "hash") {
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="text-forest underline underline-offset-2 hover:text-emerald-700"
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        }

        // mailto/tel: don't force new tab; http(s) external should
        const externalProps =
          kind === "external"
            ? { target: "_blank", rel: "noopener noreferrer" as const }
            : {};

        return (
          <a
            key={item.href}
            href={item.href}
            {...externalProps}
            className="text-forest underline underline-offset-2 hover:text-emerald-700"
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
