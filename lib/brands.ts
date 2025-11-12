// lib/brands.ts
// Minimal, typed brand registry to satisfy imports. Expand as needed.

export type BrandKey = "abraham" | "endom" | "alomarada" | "endureluxe";

export type Brand = {
  key: BrandKey;
  name: string;
  short?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    background?: string;
  };
  logo?: {
    svg?: string;
    raster?: string;
  };
  url?: string;
};

const registry: Record<BrandKey, Brand> = {
  abraham: {
    key: "abraham",
    name: "Abraham of London",
    short: "AoL",
    colors: {
      primary: "#0F172A", // deep charcoal
      secondary: "#D1B37D", // soft gold
      text: "#0F172A",
      background: "#FFFFFF",
    },
    logo: {
      svg: "/assets/images/logo/abraham-of-london-logo.svg",
      raster: "/assets/images/abraham-logo.jpg",
    },
    url: "https://abrahamoflondon.org",
  },
  endom: {
    key: "endom",
    name: "Endom",
    colors: { primary: "#111827", secondary: "#9CA3AF" },
  },
  alomarada: {
    key: "alomarada",
    name: "Alomarada Ltd",
    colors: { primary: "#1F2937", secondary: "#D1B37D" },
  },
  endureluxe: {
    key: "endureluxe",
    name: "EndureLuxe",
    colors: { primary: "#101010", secondary: "#CBA35C" },
  },
};

export function getBrand(key: BrandKey): Brand {
  return registry[key];
}

export function listBrands(): Brand[] {
  return Object.values(registry);
}