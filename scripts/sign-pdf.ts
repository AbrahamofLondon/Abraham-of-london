import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { plainAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import SignPdf from "@signpdf/signpdf";

function readP12(): Buffer {
  // Best practice: keep cert OUT of repo.
  // Option A: read from env var base64.
  const b64 = process.env.PDF_SIGN_P12_BASE64;
  if (!b64) throw new Error("Missing PDF_SIGN_P12_BASE64");
  return Buffer.from(b64, "base64");
}

async function signFile(inputPath: string, outputPath: string) {
  const p12 = readP12();
  const passphrase = process.env.PDF_SIGN_P12_PASSPHRASE || "";
  const pdfBuffer = fs.readFileSync(inputPath);

  // Add placeholder
  const doc = await PDFDocument.load(pdfBuffer);
  const out = await doc.save({ useObjectStreams: false }); // important for signing

  const withPlaceholder = plainAddPlaceholder({
    pdfBuffer: Buffer.from(out),
    reason: "Institutional release",
    contactInfo: "legacy@abrahamoflondon.com",
    name: "Abraham of London",
    location: "London, UK",
  });

  // Sign
  const signedPdf = new SignPdf().sign(withPlaceholder, p12, { passphrase });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, signedPdf);
  console.log(`✅ Signed: ${path.basename(outputPath)}`);
}

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: tsx scripts/sign-pdf.ts <input.pdf> [output.pdf]");

  const output = process.argv[3] || input.replace(/\.pdf$/i, ".signed.pdf");
  await signFile(input, output);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});