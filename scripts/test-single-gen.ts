/* scripts/test-single-gen.ts — V2.4 (WINDOWS PATH FIX) */
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { generatePDF } from "../lib/pdf-generator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testSingle() {
  // 1. Resolve path and convert to valid file:// URL for Windows
  const contentlayerPath = path.resolve(__dirname, "../.contentlayer/generated/index.mjs");
  const contentlayerUrl = pathToFileURL(contentlayerPath).href;

  console.log(`📡 Loading vault data from: ${contentlayerUrl}`);

  try {
    // 2. Dynamic Import
    const { allBriefs } = await import(contentlayerUrl);

    process.env.SYSTEM_INTEGRITY_SALT = process.env.SYSTEM_INTEGRITY_SALT || "AOL_TEST_SALT";

    const TEST_ID = "CB-AOE-078";
    console.log(`\n🧪 TESTING RESOLUTION FOR: ${TEST_ID}`);

    // 3. Map ID to Slug
    const brief = allBriefs.find((b: any) => b.institutionalId === TEST_ID);
    
    if (!brief) {
      console.error(`❌ MAPPING FAIL: ID ${TEST_ID} not found in 301 documents.`);
      return;
    }

    console.log(`✅ MAPPING SUCCESS: Found slug "${brief.slugSafe}"`);

    // 4. Generate using the generator
    const result = await generatePDF(TEST_ID, true);

    if (result.success) {
      console.log(`\n🎉 SUCCESS!`);
      console.log(`📍 Output: ${result.path}`);
      console.log(`📦 Size: ${result.buffer?.length} bytes`);
    } else {
      console.error(`\n❌ GENERATION FAILED: ${result.error}`);
    }
  } catch (err: any) {
    console.error(`\n❌ EXECUTION ERROR: ${err.message}`);
  }
}

testSingle().catch(console.error);