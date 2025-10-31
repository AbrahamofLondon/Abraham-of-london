// components/print/PrintMDXContent.tsx

// Assuming Contentlayer setup, adjust if you use useMDXComponent from next-mdx-remote
import { useMDXComponent } from "next-contentlayer/hooks"; 
import { MDXComponents } from "@/components/mdx"; // <-- CRITICAL: Consistent Map Import
import * as React from "react";

interface PrintMDXContentProps {
  code: string | null | undefined;
  title: string;
  description: string | null | undefined;
}

export default function PrintMDXContent({ code, title, description }: PrintMDXContentProps) {
  // Use the hook to generate the MDX component function
  const MDXContent = useMDXComponent(code ?? "");

  return (
    <article className="prose max-w-none mx-auto">
      {/* ... (header elements) ... */}
      
      {/* CRITICAL: The generated component function is called with the map */}
      <MDXContent components={MDXComponents} /> 
    </article>
  );
}