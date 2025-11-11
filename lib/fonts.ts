// lib/fonts.ts
export const fontPresets = {
  h1: "text-4xl font-bold font-serif",
  articleBody: "text-lg font-sans leading-relaxed",
};

export function useFontLoader(fonts: string[], preload: boolean) {
  // Your font loading logic here
  return { loaded: true };
}