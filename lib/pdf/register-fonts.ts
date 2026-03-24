/* lib/pdf/register-fonts.ts — V1.1 (CROSS-PLATFORM SAFE) */
import { Font } from "@react-pdf/renderer";
import path from "path";

/**
 * Registers the Abraham of London brand fonts.
 * Uses 'file://' protocol or absolute paths to ensure Windows/Linux compatibility.
 */
export const registerFonts = () => {
  const fontDir = path.join(process.cwd(), "public", "fonts");

  // Helper to ensure paths work across OS environments
  const getFontPath = (fileName: string) => `file://${path.join(fontDir, fileName)}`;

  Font.register({
    family: "Helvetica",
    fonts: [
      { src: getFontPath("Helvetica.ttf"), fontWeight: "normal" },
      { src: getFontPath("Helvetica-Bold.ttf"), fontWeight: "bold" },
    ],
  });

  Font.register({
    family: "Times-Bold",
    src: getFontPath("Times-Bold.ttf"),
    fontWeight: "bold",
  });

  Font.register({
    family: "Times-Roman",
    src: getFontPath("Times-Roman.ttf"),
    fontWeight: "normal",
  });
};