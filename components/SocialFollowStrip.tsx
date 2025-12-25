// components/SocialFollowStrip.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const ITEMS: Item[] = [
  { href: "https://x.com/AbrahamAda48634", label: "X", icon: Twitter },
  { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", icon: MessageCircle },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", icon: Instagram },
  { href: "https://www.facebook.com/share/1Gvu4ZunTq/", label: "Facebook", icon: Facebook },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321", label: "LinkedIn", icon: Linkedin },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", icon: Youtube },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", icon: Mail },
  { href: "tel:+442086225909", label: "Call", icon: Phone },
];

export default function SocialFollowStrip() {
  return (
    <section className="mx-auto my-20 max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-black/90 p-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <h3 className="font-serif text-3xl text-gold mb-3">Stay Connected</h3>
          <p className="text-cream/70 mb-8 max-w-2xl mx-auto">
            Strategic clarity across every platform - no noise, just signal.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {ITEMS.map((it, i) => {
              const Icon = it.icon;
              const external = it.href.startsWith("http");
              return (
                <motion.a
                  key={it.label}
                  href={it.href}
                  target={external ? "_blank" : "_self"}
                  rel={external ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold hover:text-black transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}