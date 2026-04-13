import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  FileText,
  Briefcase,
} from "lucide-react";

export type SharedNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export const SHARED_NAV_ITEMS: SharedNavItem[] = [
  {
    id: "dash",
    href: "/inner-circle/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "vault",
    href: "/vault/briefs",
    label: "Intelligence Vault",
    icon: ShieldCheck,
  },
  {
    id: "canon",
    href: "/canon",
    label: "Core Canon",
    icon: BookOpen,
  },
  {
    id: "lib",
    href: "/library",
    label: "Library",
    icon: FileText,
  },
  {
    id: "consulting",
    href: "/consulting",
    label: "Consulting",
    icon: Briefcase,
  },
];