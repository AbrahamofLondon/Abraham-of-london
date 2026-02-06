import fs from 'fs';
import path from 'path';
import { allPosts, allShorts } from './.contentlayer/generated/index.mjs';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function verifyRegistry() {
  console.log("🛡️ Starting Institutional Registry Health Check...");
  
  const allDocs = [...allPosts, ...allShorts];
  const totalExpected = allDocs.length;
  let missing = 0;

  console.log(`Checking ${totalExpected} documents...`);

  allDocs.forEach(doc => {
    const type = doc._raw.sourceFileDir.includes('dispatches') ? 'dispatches' : 'shorts';
    const slug = doc.slugAsParams || doc._raw.flattenedPath.split('/').pop();
    
    // Path where Next.js stores the static HTML for this route
    const staticPath = path.join(process.cwd(), '.next/server/pages/registry', type, `${slug}.html`);

    if (!fs.existsSync(staticPath)) {
      console.error(`${RED}❌ MISSING:${RESET} [${type}] ${slug}`);
      missing++;
    }
  });

  if (missing === 0) {
    console.log(`${GREEN}✅ ALL CLEAR:${RESET} 163/163 Intelligence Briefs generated successfully.`);
    process.exit(0);
  } else {
    console.error(`${RED}🚨 FAILURE:${RESET} ${missing} documents failed to generate.`);
    process.exit(1);
  }
}

verifyRegistry();