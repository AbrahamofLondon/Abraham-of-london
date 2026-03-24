// lib/shorts/share-platforms.tsx
import type { LucideIcon } from "lucide-react";
import { Twitter, Facebook, Linkedin, Mail } from "lucide-react";

export type SharePlatform = {
  id: "x" | "facebook" | "linkedin" | "email";
  name: string;
  icon: LucideIcon;
  color?: string;
  shareUrl: (url: string, title: string) => string;
};

export const sharePlatforms: SharePlatform[] = [
  {
    id: "x",
    name: "X",
    icon: Twitter,
    color: "bg-black",
    shareUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-[#4267B2]",
    shareUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-[#0077B5]",
    shareUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    color: "bg-[#EA4335]",
    shareUrl: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
  },
];