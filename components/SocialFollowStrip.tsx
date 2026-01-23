// components/SocialFollowStrip.tsx - UPDATED
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
  Globe,
} from "lucide-react";
import { siteConfig, getSocialLinks } from "@/config/site";

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'x': Twitter,
  'twitter': Twitter,
  'linkedin': Linkedin,
  'instagram': Instagram,
  'facebook': Facebook,
  'youtube': Youtube,
  'email': Mail,
  'phone': Phone,
  'tiktok': MessageCircle,
  'website': Globe,
  'whatsapp': MessageCircle,
};

export default function SocialFollowStrip() {
  const socialLinks = getSocialLinks(10); // Get top priority social links
  
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
            {socialLinks.map((social, i) => {
              const Icon = iconMap[social.kind] || Globe;
              const external = social.href.startsWith("http");
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
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
                  {social.label}
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}