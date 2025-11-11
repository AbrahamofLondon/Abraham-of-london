// components/Article.tsx
"use client";

import fontPresets, { useFontLoader } from "@/lib/fonts";

export function Article() {
  const { loaded } = useFontLoader(["serif", "sans"], true);

  if (!loaded) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <h1 className={fontPresets.h1}>Article Title</h1>
      <p className={fontPresets.articleBody}>
        This is a sample article with properly loaded fonts. The typography uses
        the font presets system for consistent styling across the application.
      </p>
    </article>
  );
}

// Export the simplified version
export function SimpleArticle() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className={fontPresets.h1}>Article Title</h1>
      <p className={fontPresets.articleBody}>
        This is a simple article that uses the font presets without any loading
        states.
      </p>
    </article>
  );
}