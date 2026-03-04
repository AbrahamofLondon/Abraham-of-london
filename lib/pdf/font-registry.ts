// lib/pdf/font-registry.ts
import fs from "fs";
import path from "path";

let fontsRegistered = false;

type ReactPdfFont = {
  register: (opts: {
    family: string;
    fonts: Array<{
      src: string; // MUST be string for your installed @react-pdf/font build
      fontWeight?: number;
      fontStyle?: "normal" | "italic";
    }>;
  }) => void;
};

function toDataUrlTTF(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  const b64 = buf.toString("base64");
  // "font/ttf" is accepted by React-PDF loaders; "application/x-font-ttf" also works
  return `data:font/ttf;base64,${b64}`;
}

/**
 * Register AoLInter on the SAME @react-pdf/renderer instance that renders the PDF.
 * Windows-safe + Undici-safe:
 * ✅ No file:// fetch
 * ✅ No C:\ scheme confusion
 * ✅ No Buffer passed into font loader
 */
export function registerPDFFonts(Font: ReactPdfFont) {
  if (fontsRegistered) return;

  const fontDir = path.join(process.cwd(), "public", "fonts");

  const regularPath = path.join(fontDir, "Inter-Regular.ttf");
  const semiBoldPath = path.join(fontDir, "Inter-SemiBold.ttf");
  const italicPath = path.join(fontDir, "Inter_18pt-Italic.ttf");

  const fonts: Array<{
    src: string;
    fontWeight?: number;
    fontStyle?: "normal" | "italic";
  }> = [];

  if (fs.existsSync(regularPath)) {
    fonts.push({ src: toDataUrlTTF(regularPath), fontWeight: 400 });
    console.log("✅ Found font: Inter-Regular.ttf");
  }

  if (fs.existsSync(semiBoldPath)) {
    // Your template uses 700 everywhere; map semibold into 700 slot unless you add Inter-Bold.ttf later.
    fonts.push({ src: toDataUrlTTF(semiBoldPath), fontWeight: 700 });
    console.log("✅ Found font: Inter-SemiBold.ttf");
  }

  if (fs.existsSync(italicPath)) {
    fonts.push({ src: toDataUrlTTF(italicPath), fontWeight: 400, fontStyle: "italic" });
    console.log("✅ Found font: Inter_18pt-Italic.ttf");
  }

  if (fonts.length === 0) {
    console.warn("⚠️ No Inter fonts found in /public/fonts. Using built-in fonts only.");
    fontsRegistered = true;
    return;
  }

  Font.register({
    family: "AoLInter",
    fonts,
  });

  console.log("✅ AoLInter font family registered successfully");
  fontsRegistered = true;
}

export function checkFontRegistration() {
  return fontsRegistered;
}