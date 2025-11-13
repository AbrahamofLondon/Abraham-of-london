// components/Article.tsx
import * as React from "react";

export interface ArticleProps extends React.PropsWithChildren {
  className?: string;
}

export function Article({ children, className = "" }: ArticleProps) {
  return (
    <article className={`prose prose-lg max-w-none ${className}`}>
      {children}
    </article>
  );
}

export default Article;