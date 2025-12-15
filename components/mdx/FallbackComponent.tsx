// components/mdx/FallbackComponent.tsx
import * as React from "react";

interface FallbackProps {
  componentName: string;
  children?: React.ReactNode;
}

export const FallbackComponent: React.FC<FallbackProps> = ({ 
  componentName, 
  children 
}) => {
  console.warn(`MDX component "${componentName}" is not defined. Using fallback.`);
  
  switch (componentName) {
    case "Grid":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          {children}
        </div>
      );
    // Add other fallbacks as needed
    default:
      return (
        <div className="border border-amber-500/30 bg-amber-500/10 p-4 my-4 rounded-lg">
          <p className="text-amber-400 text-sm">
            Component &ldquo;{componentName}&rdquo; is not defined.
          </p>
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>
      );
  }
};