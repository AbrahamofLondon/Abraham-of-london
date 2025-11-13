// components/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/lib/siteConfig';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-deepCharcoal text-warmWhite py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-serif font-semibold">
                Abraham of London
              </span>
            </div>
            <p className="text-warmWhite/70 text-sm leading-relaxed">
              Professional insights and portfolio showcasing expertise in 
              technology, leadership, and innovation.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-warmWhite">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/"
                  className="text-warmWhite/70 hover:text-warmWhite transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/about"
                  className="text-warmWhite/70 hover:text-warmWhite transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/print"
                  className="text-warmWhite/70 hover:text-warmWhite transition-colors"
                >
                  Print Materials
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-warmWhite">Connect</h3>
            <div className="flex space-x-4">
              (siteConfig.socialLinks ?? []).map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target={social.external ? "_blank" : undefined}
                  rel={social.external ? "noopener noreferrer" : undefined}
                  className="text-warmWhite/70 hover:text-warmWhite transition-colors"
                  aria-label={social.label}
                >
                  <span className="sr-only">{social.label}</span>
                  {/* Add social icons here if needed */}
                  {social.label}
                </a>
              ))}
            </div>
            <div className="text-sm text-warmWhite/70">
              <a 
                href={`mailto:${siteConfig.email}`}
                className="hover:text-warmWhite transition-colors"
              >
                {siteConfig.email}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-warmWhite/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-warmWhite/60">
              © {currentYear} {(siteConfig as any).company ?? "Abraham of London"}. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-warmWhite/60">
              <Link 
                href="/privacy"
                className="hover:text-warmWhite transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms"
                className="hover:text-warmWhite transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}