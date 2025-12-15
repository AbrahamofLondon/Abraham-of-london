// components/MDXClient.tsx
import * as React from "react";
import { useMDXComponent } from "next-contentlayer/hooks";

interface MDXClientProps {
  code: string;
  components?: Record<string, React.ComponentType<any>>;
}

export default function MDXClient({ code, components = {} }: MDXClientProps) {
  const MDXContent = useMDXComponent(code);
  
  return (
    <React.Suspense 
      fallback={
        <div className="min-h-[200px] flex items-center justify-center">
          <p className="text-sm opacity-80">Loading MDX content…</p>
        </div>
      }
    >
      <MDXContent components={components} />
    </React.Suspense>
  );
}