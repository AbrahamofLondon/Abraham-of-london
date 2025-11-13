import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

type Props = {
  className?: string;
};

export default function SocialLinks({ className = "" }: Props): JSX.Element | null {
  const socials = siteConfig.socialLinks ?? [];
  if (!socials.length) return null;

  return (
    <ul className={["flex flex-wrap items-center gap-3", className].filter(Boolean).join(" ")}>
      {socials.map((s, i) => {
        const href = s.href?.trim() ?? "#";
        const label = s.label ?? href.replace(/^https?:\/\//, "");
        const external = /^https?:\/\//i.test(href);

        return (
          <li key={`${label}-${i}`}>
            {external ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {label}
              </a>
            ) : (
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}