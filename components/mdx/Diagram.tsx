/* components/mdx/Diagram.tsx */
import * as React from "react";
import Image from "next/image";

interface DiagramProps {
  src: string;
  caption?: string;
  alt?: string;
  className?: string;
}

export default function Diagram({ src, caption, alt, className = "" }: DiagramProps) {
  return (
    <figure className={`my-12 ${className}`}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent p-1">
        <div className="relative aspect-video w-full">
          <Image
            src={src}
            alt={alt || caption || "Diagram"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      </div>

      {caption && (
        <figcaption className="mt-4 text-center">
          <span className="inline-block border-t border-white/10 pt-3 text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">
            {caption}
          </span>
        </figcaption>
      )}
    </figure>
  );
}