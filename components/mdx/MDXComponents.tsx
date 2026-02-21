/* eslint-disable no-restricted-imports */
import * as React from "react";
import base from "@/components/mdx-components";

type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

type MDXComponent = React.ComponentType<MDXComponentProps>;
type ComponentMap = Record<string, MDXComponent>;

const MDXComponents: ComponentMap = base as ComponentMap;

export const getSafeComponents = (custom: ComponentMap = {}): ComponentMap => {
  const map: ComponentMap = { ...MDXComponents };

  // All components that need fallbacks
  const required = [
    "BrandFrame",
    "HeroEyebrow",
    "ResourcesCTA",
    "JsonLd",
    "Caption",
    "CTA",
    "CTAGroup",
    "BriefAlert", // ✅ Added to prevent future build errors
  ];

  // Ensure all required components have fallbacks
  for (const comp of required) {
    if (!map[comp]) {
      map[comp] = (props: MDXComponentProps) => {
        const { children, className = "", ...rest } = props;
        return (
          <div
            className={`mdx-fallback ${comp.toLowerCase()} ${className}`}
            {...rest}
          >
            {children}
          </div>
        );
      };
    }
  }

  return { ...map, ...custom };
};

export default MDXComponents;