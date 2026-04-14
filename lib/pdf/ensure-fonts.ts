// lib/pdf/ensure-fonts.ts
//
// Lazy font registration. Dynamic imports keep @react-pdf/renderer out of
// the module graph at import time — only callers that actually invoke
// ensureFontsRegistered() pay the cost, and only on first call.

let fontsRegistered = false;

export async function ensureFontsRegistered(): Promise<void> {
  if (fontsRegistered) {
    return;
  }

  try {
    const ReactPDF = await import("@react-pdf/renderer");
    const { default: registerInstitutionalFonts } = await import("./register-fonts");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerInstitutionalFonts(ReactPDF as any);
    fontsRegistered = true;
    console.log("✅ [ensureFontsRegistered] Fonts registered successfully");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ [ensureFontsRegistered] CRITICAL font registration failure:", message);
    throw err;
  }
}
