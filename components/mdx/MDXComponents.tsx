/* eslint-disable no-restricted-imports */
import * as React from "react";
import base from "@/components/mdx-components";

type MDXComponentProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

type MDXComponent = React.ComponentType<MDXComponentProps>;
type ComponentMap = Record<string, MDXComponent>;

const BASE_COMPONENTS: ComponentMap = base as ComponentMap;

const REQUIRED_COMPONENTS = [
  "BrandFrame",
  "HeroEyebrow",
  "ResourcesCTA",
  "JsonLd",
  "Caption",
  "CTA",
  "CTAGroup",
  "BriefAlert",
  "DocumentFooter",
] as const;

function createFallbackComponent(name: string): MDXComponent {
  const FallbackComponent = ({
    children,
    className,
    ...rest
  }: MDXComponentProps) => {
    const safeClassName = typeof className === "string" ? className : "";

    return (
      <div
        className={`mdx-fallback ${name.toLowerCase()} ${safeClassName}`.trim()}
        {...rest}
      >
        {children}
      </div>
    );
  };

  FallbackComponent.displayName = `${name}Fallback`;
  return FallbackComponent;
}

export const getSafeComponents = (
  custom?: Partial<ComponentMap>,
): ComponentMap => {
  const map: ComponentMap = { ...BASE_COMPONENTS };

  for (const name of REQUIRED_COMPONENTS) {
    if (!map[name]) {
      map[name] = createFallbackComponent(name);
    }
  }

  if (custom) {
    for (const [key, value] of Object.entries(custom)) {
      if (value) {
        map[key] = value as MDXComponent;
      }
    }
  }

  return map;
};

const MDXComponents = getSafeComponents();

export default MDXComponents;