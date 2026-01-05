import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { plainAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import SignPdf from "@signpdf/signpdf";

function readP12(): Buffer {
  const b64 = process.env.PDF_SIGN_P12_BASE64;
  if (!b64) throw new Error("Missing PDF_SIGN_P12_BASE64");
  return Buffer.from(b64, "base64");
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function signFile(inputPath: string, outputPath: string) {
  const p12 = readP12();
  const passphrase = process.env.PDF_SIGN_P12_PASSPHRASE || "";

  const src = fs.readFileSync(inputPath);

  const doc = await PDFDocument.load(src);
  const plain = await doc.save({ useObjectStreams: false }); // important

  const withPlaceholder = plainAddPlaceholder({
    pdfBuffer: Buffer.from(plain),
    reason: "Premium/Enterprise distribution",
    contactInfo: "legacy@abrahamoflondon.com",
    name: "Abraham of London",
    location: "London, UK",
  });

  const signedPdf = new SignPdf().sign(withPlaceholder, p12, { passphrase });

  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, signedPdf);
  console.log(`✅ Signed: ${path.basename(outputPath)}`);
}

async function main() {
  const unsignedDir = path.join(process.cwd(), "private_downloads", "unsigned");
  const signedDir = path.join(process.cwd(), "private_downloads", "signed");

  ensureDir(unsignedDir);
  ensureDir(signedDir);

  const files = fs.readdirSync(unsignedDir).filter((f) => f.endsWith(".pdf"));

  // Only sign premium + enterprise
  const targets = files.filter((f) => f.includes("-premium.pdf") || f.includes("-enterprise.pdf"));

  if (targets.length === 0) {
    console.log("No premium/enterprise PDFs found to sign.");
    return;
  }

  for (const f of targets) {
    const inPath = path.join(unsignedDir, f);
    const outName = f.replace(/\.pdf$/i, ".signed.pdf");
    const outPath = path.join(signedDir, outName);
    await signFile(inPath, outPath);
  }

  console.log("✅ Signing pass complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});