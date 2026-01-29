// components/canon/CanonReader.tsx (current content)
import * as React from "react";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";

interface CanonReaderProps {
  source: MDXRemoteSerializeResult;
  components?: any;
}

export default function CanonReader({ source, components }: CanonReaderProps) {
  if (!source?.compiledSource) {
    return (
      <div className="p-8 rounded-lg border border-white/10 bg-white/5">
        <p className="text-gray-400 text-center">Content not available</p>
      </div>
    );
  }

  return (
    <div className="canon-reader">
      <MDXRemote {...source} components={components} />
    </div>
  );
}