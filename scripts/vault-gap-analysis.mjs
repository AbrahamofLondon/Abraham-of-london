import fs from 'fs';
import path from 'path';

/**
 * VAULT GAP ANALYSIS (Deep Clean Version)
 * Strips Code, JSX, Frontmatter, and Technical Artifacts.
 */
async function runAnalysis() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');
  if (!fs.existsSync(SDK_PATH)) process.exit(1);

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
    const DEFINED = new Set(["sovereignty", "integrity", "strategic autonomy", "institutional integrity"]);
    
    // Comprehensive noise filter
    const stopWords = new Set([
      "the", "and", "that", "this", "with", "from", "your", "their", "which", "about", 
      "would", "should", "could", "there", "these", "between", "through", "because", 
      "without", "strong", "classname", "components", "divider", "volume", "layout",
      "import", "export", "default", "return", "const", "props"
    ]);

    const wordFrequency = {};

    allDocuments.forEach(doc => {
      let text = doc.body.raw;

      // 1. Remove Frontmatter (Metadata at start of file)
      text = text.replace(/^---[\s\S]*?---/, '');
      
      // 2. Remove Code Blocks (```)
      text = text.replace(/```[\s\S]*?```/g, '');
      
      // 3. Remove JSX/HTML Tags (<Component className="..." />)
      text = text.replace(/<[^>]*>?/gm, '');

      // 4. Tokenize and Filter
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ') 
        .split(/\s+/)
        .filter(w => w.length > 5); // Focus on substantial terms

      words.forEach(word => {
        if (!stopWords.has(word) && !DEFINED.has(word)) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    const topGaps = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    console.log(`\n--- 💎 Pure Philosophical Gaps (163 Briefs) ---`);
    console.table(topGaps.map(([term, count]) => ({ 
      Pillar: term.toUpperCase(), 
      Weight: count,
      Action: "Assign Lexicon Definition"
    })));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runAnalysis();