// components/admin/AdminSidebar.tsx (or your admin navigation)

import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Settings,
  BarChart3,
  ShieldCheck
} from "lucide-react";

const adminNavItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/admin/campaigns",
    label: "Campaigns",
    icon: TrendingUp
  },
  {
    href: "/admin/reports",
    label: "Executive Reports",
    icon: FileText,
    children: [
      {
        href: "/admin/reports",
        label: "All Reports",
      },
      {
        href: "/admin/reports/insights",
        label: "Intelligence Briefs",
      },
      {
        href: "/admin/reports/analytics",
        label: "Market Analytics",
      }
    ]
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings
  }
];