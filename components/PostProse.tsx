// components/PostProse.tsx
import { ReactNode } from "react";

export default function PostProse({ children }: { children: ReactNode }) {
  return (
    <article className="prose prose-neutral md:prose-lg lg:prose-xl
      prose-h1:mb-3 prose-h2:mt-10 prose-h2:mb-3 prose-p:leading-relaxed
      prose-blockquote:border-l-2 prose-blockquote:italic
      prose-strong:font-semibold mx-auto max-w-3xl">
      {children}
    </article>
  );
}
