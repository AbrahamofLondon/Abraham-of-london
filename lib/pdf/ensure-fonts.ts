// lib/pdf/ensure-fonts.ts
import registerInstitutionalFonts from "./register-fonts";
import type { ReactPdfModuleLike } from "./register-fonts";

let fontsRegistered = false;

export async function ensureFontsRegistered(
  ReactPDF: ReactPdfModuleLike,
  projectRoot: string = process.cwd(),
): Promise<void> {
  if (fontsRegistered) {
    return;
  }

  try {
    registerInstitutionalFonts(ReactPDF, projectRoot);
    fontsRegistered = true;
    console.log("✅ [ensureFontsRegistered] Fonts registered successfully");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ [ensureFontsRegistered] CRITICAL font registration failure:", message);
    throw err;
  }
}
