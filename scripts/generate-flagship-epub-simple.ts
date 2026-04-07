import Epub from 'epub-gen-memory';
import { getPublicationBySlug } from '../lib/editorial/catalogue';
import path from 'path';
import fs from 'fs';

async function generateFlagshipEpub() {
  const publication = getPublicationBySlug('ultimate-purpose-of-man');
  
  if (!publication) {
    console.error('Publication not found');
    return;
  }

  const options = {
    title: publication.title,
    author: publication.author,
    publisher: 'Abraham of London',
    description: publication.description || '',
    lang: 'en',
    content: [
      {
        title: publication.title,
        data: `
          <h1>${publication.title}</h1>
          ${publication.subtitle ? `<h2>${publication.subtitle}</h2>` : ''}
          ${publication.description ? `<p>${publication.description}</p>` : ''}
          <p>Full editorial content goes here...</p>
        `
      }
    ]
  };

  const outputDir = path.join(process.cwd(), 'public', 'epubs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${publication.slug}.epub`);
  
  await new Promise((resolve, reject) => {
    new Epub(options, outputPath)
      .promise
      .then(resolve)
      .catch(reject);
  });
  
  console.log(`✅ EPUB generated at ${outputPath}`);
}

generateFlagshipEpub().catch(console.error);