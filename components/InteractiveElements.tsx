// components/InteractiveElements.tsx
import Link from "next/link";
import * as React from "react";

type NavItem = { href: string; label: string };

const nav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

const isInternal = (href: string) =>
  href.startsWith("/") || href.startsWith("#");

export default function InteractiveElements() {
  return (
    <nav className="flex flex-col gap-2">
      {nav.map((item) =>
        isInternal(item.href) ? (
          // ✅ Internal — use Next Link
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className="text-forest underline underline-offset-2 hover:text-emerald-700"
          >
            {item.label}
          </Link>
        ) : (
          // 🌐 External/mail/tel — plain <a>
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest underline underline-offset-2 hover:text-emerald-700"
          >
            {item.label}
          </a>
        )
      )}
    </nav>
  );
}
