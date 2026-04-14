// lib/pdf/ensure-fonts.ts
import * as ReactPDF from "@react-pdf/renderer";
import registerInstitutionalFonts from "./register-fonts";

let fontsRegistered = false;

export function ensureFontsRegistered(): void {
  if (fontsRegistered) {
    return;
  }

  try {
    registerInstitutionalFonts(ReactPDF);
    fontsRegistered = true;
    console.log("✅ [ensureFontsRegistered] Fonts registered successfully");
  } catch (err: any) {
    console.error("❌ [ensureFontsRegistered] CRITICAL font registration failure:", err.message);
    throw err;
  }
}
