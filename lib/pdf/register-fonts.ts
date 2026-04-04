/**
 * lib/pdf/register-fonts.ts
 *
 * CANONICAL FONT REGISTRATION FOR @react-pdf/renderer
 * ESM-safe, Next-safe, CLI-safe.
 */

import path from "path";
import fs from "fs";

/* -------------------------------------------------------------------------- */
/* Public constants                                                            */
/* -------------------------------------------------------------------------- */

export const PDF_FONT_FAMILIES = {
  inter: "AoLInter",
  serif: "AoLSerif",
} as const;

export type PdfFontFamily =
  (typeof PDF_FONT_FAMILIES)[keyof typeof PDF_FONT_FAMILIES];

export const CANONICAL_PDF_FONT_FAMILY: PdfFontFamily =
  PDF_FONT_FAMILIES.inter;

/* -------------------------------------------------------------------------- */
/* Internal types                                                              */
/* -------------------------------------------------------------------------- */

type FontConfig = {
  family: string;
  fonts: Array<{
    src: string;
    fontWeight?: number;
    fontStyle?: "normal" | "italic" | "oblique";
  }>;
};

export type ReactPdfModuleLike = {
  Font: {
    register: (config: FontConfig) => void;
  };
};

/* -------------------------------------------------------------------------- */
/* Font path resolution                                                        */
/* -------------------------------------------------------------------------- */

function resolveFontPath(filename: string, projectRoot: string): string {
  const candidates = [
    path.join(projectRoot, "public", "fonts", filename),
    path.join(projectRoot, "assets", "fonts", filename),
    path.join(projectRoot, "fonts", filename),
    path.join(projectRoot, "src", "assets", "fonts", filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `[FontRegistry] Font file not found: "${filename}"\n` +
      `Searched:\n${candidates.map((c) => `  • ${c}`).join("\n")}`
  );
}

/* -------------------------------------------------------------------------- */
/* Registration                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Registers all font families on the provided @react-pdf/renderer instance.
 *
 * Usage:
 *   const ReactPDF = await import("@react-pdf/renderer");
 *   registerPdfFonts(ReactPDF, process.cwd());
 */
export function registerPdfFonts(
  ReactPDF: ReactPdfModuleLike,
  projectRoot: string = process.cwd()
): void {
  if (!ReactPDF || !ReactPDF.Font || typeof ReactPDF.Font.register !== "function") {
    throw new Error(
      "[FontRegistry] registerPdfFonts requires a live @react-pdf/renderer module instance."
    );
  }

  const interRegular = resolveFontPath("Inter-Regular.ttf", projectRoot);
  const interSemiBold = resolveFontPath("Inter-SemiBold.ttf", projectRoot);
  const interItalic = resolveFontPath("Inter_18pt-Italic.ttf", projectRoot);
  const interBold = resolveFontPath("Inter_18pt-Bold.ttf", projectRoot);

  console.log(`✅ Found font: ${path.basename(interRegular)}`);
  console.log(`✅ Found font: ${path.basename(interSemiBold)}`);
  console.log(`✅ Found font: ${path.basename(interItalic)}`);
  console.log(`✅ Found font: ${path.basename(interBold)}`);

  ReactPDF.Font.register({
    family: PDF_FONT_FAMILIES.inter,
    fonts: [
      {
        src: interRegular,
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: interSemiBold,
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: interItalic,
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: interBold,
        fontWeight: 700,
        fontStyle: "normal",
      },
    ],
  });

  console.log("✅ AoLInter font family registered successfully");

  ReactPDF.Font.register({
    family: PDF_FONT_FAMILIES.serif,
    fonts: [
      {
        src: interRegular,
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: interItalic,
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: interBold,
        fontWeight: 700,
        fontStyle: "normal",
      },
    ],
  });

  console.log("✅ AoLSerif font family registered successfully");

  /**
   * Backward compatibility for legacy templates still using "Inter".
   */
  ReactPDF.Font.register({
    family: "Inter",
    fonts: [
      {
        src: interRegular,
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: interSemiBold,
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: interItalic,
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: interBold,
        fontWeight: 700,
        fontStyle: "normal",
      },
    ],
  });

  console.log("✅ Inter font family registered successfully");
}

export const registerFonts = registerPdfFonts;
export default registerPdfFonts;