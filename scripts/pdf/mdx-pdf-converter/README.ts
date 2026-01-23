// scripts/pdf/mdx-pdf-converter/README.ts (optional helper — safe to delete)
// This is NOT required for runtime; it's here so nobody “forgets” why fonts are required.
/*
REQUIRED FONTS (place under scripts/pdf/fonts/):

- PlayfairDisplay-Regular.ttf
- PlayfairDisplay-Bold.ttf
- NotoSans-Regular.ttf
- NotoSans-Bold.ttf

WHY:
- pdf-lib StandardFonts are WinAnsi-limited -> they crash on arrows, smart quotes, emojis, etc.
- Unicode fonts + fontkit eliminate that entire class of failures permanently.

INSTALL:
pnpm add pdf-lib @pdf-lib/fontkit gray-matter

RUN:
pnpm tsx scripts/pdf/generate-all-from-mdx.ts
*/
export {};