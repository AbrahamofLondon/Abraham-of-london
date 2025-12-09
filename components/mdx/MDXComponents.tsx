/* eslint-disable no-restricted-imports */
import * as React from "react";
import base from "@/components/mdx/MDXComponents";

type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
  // allow arbitrary MDX props, but keep them typed as unknown rather than any
  [key: string]: unknown;
};

type MDXComponent = React.ComponentType<MDXComponentProps>;
type ComponentMap = Record<string, MDXComponent>;

const MDXComponents: ComponentMap = base as ComponentMap;

export const getSafeComponents = (custom: ComponentMap = {}): ComponentMap => {
  const map: ComponentMap = { ...MDXComponents };

  // guarantee fallbacks for commonly used MDX tags
  const required = [
    "BrandFrame",
    "HeroEyebrow",
    "ResourcesCTA",
    "JsonLd",
    "Caption",
    "CTA",
    "CTAGroup",
  ];

  for (const comp of required) {
    if (!map[comp]) {
      map[comp] = (props: MDXComponentProps) => {
        const { children, className = "", ...rest } = props;
        return (
          <div
            className={`mdx-fallback ${comp.toLowerCase()} ${className}`}
            // eslint-disable-next-line react/jsx-props-no-spreading
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
