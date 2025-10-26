// components/print/PrintMDXContent.tsx
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import * as React from "react";

interface PrintMDXContentProps {
  code: string;
  title: string;
  description: string;
}

export default function PrintMDXContent({ code, title, description }: PrintMDXContentProps) {
  // Directly use the MDX hook inside this client component
  const MDXContent = useMDXComponent(code ?? "");

  return (
    <article className="prose max-w-none mx-auto">
      <h1 className="font-serif">{title}</h1>
      {description && <p className="text-lg">{description}</p>}
      <MDXContent components={components as any} />
    </article>
  );
}