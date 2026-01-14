// lib/pdf-handler.ts
export async function getStaticPDFs() {
  // This function will be called at build time
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    const pdfsDir = path.join(process.cwd(), 'public/assets/downloads');
    const files = await fs.readdir(pdfsDir, { recursive: true });
    
    return files
      .filter(file => file.endsWith('.pdf'))
      .map(file => ({
        url: `/assets/downloads/${file}`,
        name: path.basename(file, '.pdf'),
        path: file,
        size: 0, // You could add actual file size here
      }));
  } catch (error) {
    console.log('PDF scanning skipped in development');
    return [];
  }
}

export function getPDFUrl(filename: string) {
  // Always returns the correct URL for both dev and prod
  return `/assets/downloads/public-assets/resources/pdfs/${filename}`;
}