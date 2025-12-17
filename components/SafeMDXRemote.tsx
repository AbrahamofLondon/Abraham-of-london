// components/SafeMDXRemote.tsx
import * as React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

type Props = {
  source: MDXRemoteSerializeResult;
  components?: Record<string, React.ComponentType<any>>;
  loadingText?: string;
};

export default function SafeMDXRemote({
  source,
  components,
  loadingText = "Loading content…",
}: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-sm opacity-80">{loadingText}</p>
      </div>
    );
  }

  return <MDXRemote {...source} components={components} />;
}