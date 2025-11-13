import * as React from "react";
import Link from "next/link";
import { siteConfig, absUrl } from "@/lib/siteConfig";

export default function Footer(): JSX.Element {
  const socials = siteConfig.socialLinks ?? [];

  return (
    <footer className="mt-16 w-full border-t border-lightGrey bg-white text-deepCharcoal">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
        <div className="text-sm">
          <span className="font-semibold">{siteConfig.title}</span>
          <span className="mx-2">•</span>
          <Link href={absUrl("/")} className="hover:underline">
            Home
          </Link>
          {siteConfig.email ? (
            <>
              <span className="mx-2">•</span>
              <a href={`mailto:${siteConfig.email}`} className="hover:underline">
                {siteConfig.email}
              </a>
            </>
          ) : null}
        </div>

        {socials.length > 0 && (
          <ul className="flex flex-wrap items-center gap-4 text-sm">
            {socials.map((social, index) => {
              const href = social.href?.trim() ?? "#";
              const label = social.label ?? href.replace(/^https?:\/\//, "");
              const external = Boolean((social as any).external) || /^https?:\/\//i.test(href);

              return (
                <li key={`${label}-${index}`}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      aria-label={label}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link href={href} className="hover:underline" aria-label={label}>
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-warmWhite/60 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} {siteConfig.title}. All rights reserved.
      </div>
    </footer>
  );
}