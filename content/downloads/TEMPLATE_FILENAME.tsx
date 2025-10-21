// content/downloads/TEMPLATE_FILENAME.tsx

import BrandFrame from "../../components/print/BrandFrame";
import * as React from "react";
// Add any other imports needed for this specific download (e.g., PullLine, EmbossedBrandMark)

// --- Metadata Definition (REPLACES FRONTMATTER) ---
export const metadata = {
  // ⚠️ CUSTOMIZE THESE VALUES FOR EACH FILE ⚠️
  title: "The Correct Title for This Download",
  slug: "the-file-slug",
  date: "YYYY-MM-DD",
  author: "Abraham of London",
  readTime: "X min",
  category: "Correct Category",
  type: "download",
  subtitle: "A concise description of the download."
};

// ⚠️ CUSTOMIZE THIS COMPONENT NAME ⚠️
const TheComponentName = () => {
  return (
    <BrandFrame
      title={metadata.title}
      subtitle={metadata.subtitle}
      pageSize="A4" 
      {/* If your BrandFrame uses 'author' or 'date', pass them here: */}
      {/* author={metadata.author} */}
      {/* date={metadata.date} */}
    >
      {/* All C-style comments (//) MUST be changed to JSX block comments ({/* ... * /}) */}
      
      <div className="download-content-wrapper">
          
          <h1 className="text-xl">{metadata.title}</h1>
          <p className="italic">{metadata.subtitle}</p>

          {/* Start of Download Content */}
          <p>This is where the unique content for this download goes.</p>
          {/* End of Download Content */}
          
      </div>
      
    </BrandFrame>
  );
};

// ⚠️ CUSTOMIZE THIS EXPORT ⚠️
export default TheComponentName;