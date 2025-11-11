/* eslint-disable no-restricted-imports */
import base from "@/components/mdx/MDXComponents";

type AnyRec = Record<string, any>;
const MDXComponents: AnyRec = base;

export const getSafeComponents = (custom: AnyRec = {}): AnyRec => {
  const map = { ...MDXComponents };

  // guarantee fallbacks for commonly used MDX tags
  const required = [
    "BrandFrame",
    "HeroEyebrow",
    "ResourcesCTA",
    "JsonLd",
    "Caption",
    "CTA",
    "CTAGroup"
  ];

  for (const comp of required) {
    if (!map[comp]) {
      map[comp] = ({ children, className = "" }) => (
        <div className={`mdx-fallback ${comp.toLowerCase()} ${className}`}>
          {children}
        </div>
      );
    }
  }

  return { ...map, ...custom };
};

export default MDXComponents;
