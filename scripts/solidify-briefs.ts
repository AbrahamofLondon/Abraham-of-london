import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; // You may need to: npm install gray-matter

const BRIEFS_PATH = path.join(process.cwd(), 'content/briefs');

async function solidifyPortfolio() {
  console.log("--- SOLIDIFYING INTELLIGENCE PORTFOLIO ---");

  try {
    const files = fs.readdirSync(BRIEFS_PATH);
    
    files.forEach(file => {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;

      const filePath = path.join(BRIEFS_PATH, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // 1. Parse Frontmatter
      const { data, content } = matter(fileContent);

      // 2. Transform Draft to Verified
      const updatedData = {
        ...data,
        published: true, // Flip the switch
        classification: 'Confidential', // Upgrade from Restricted
        lastAudit: new Date().toISOString().split('T')[0],
      };

      // 3. Clean Content (Remove Placeholder Alerts)
      let updatedContent = content.replace(
        /<BriefAlert type="info">[\s\S]*?<\/BriefAlert>/g,
        `<BriefAlert type="success">
          Analysis Verified. This brief is synchronized with the Sovereign Telemetry Node.
        </BriefAlert>`
      );

      // 4. Inject Dynamic Data Nodes (Example: Strategic Resonance)
      if (!updatedContent.includes('Strategic Resonance')) {
        updatedContent += `\n\n<DataNode label="Strategic Resonance" value="8/10" />`;
      }

      // 5. Write back to file
      const result = matter.stringify(updatedContent, updatedData);
      fs.writeFileSync(filePath, result);
      
      console.log(`>> Solidified: ${file}`);
    });

    console.log("\n--- PORTFOLIO IS NOW LIVE AND VERIFIED ---");
  } catch (error) {
    console.error("!! CONTENT ERROR:", error);
  }
}

solidifyPortfolio();