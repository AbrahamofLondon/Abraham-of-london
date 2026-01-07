// components/mdx/FallbackComponent.tsx
import * as React from "react";

export interface FallbackProps {
  componentName: string;
  children?: React.ReactNode;
}

export const FallbackComponent: React.FC<FallbackProps> = ({
  componentName,
  children,
}) => {
  console.warn(
    `MDX component "${componentName}" is not defined. Using fallback.`
  );

  switch (componentName) {
    case "Grid":
      return (
        <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {children}
        </div>
      );

    default:
      return (
        <div className="my-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-400">
            Component &ldquo;{componentName}&rdquo; is not defined.
          </p>
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
      );
  }
};

export default FallbackComponent;