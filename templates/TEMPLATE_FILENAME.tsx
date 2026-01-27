// content/downloads/TEMPLATE_FILENAME.tsx
import * as React from "react";
import BrandFrame from "../../components/print/BrandFrame";

export const metadata = {
  title: "The Correct Title for This Download",
  slug: "the-file-slug",
  date: "YYYY-MM-DD",
  author: "Abraham of London",
  readTime: "X min",
  category: "Correct Category",
  type: "download",
  subtitle: "A concise description of the download.",
};

const TheComponentName: React.FC = () => {
  return (
    <>
      {/* Optional notes about props go here (outside the tag), not inside the prop list. */}
      <BrandFrame
        title={metadata.title}
        subtitle={metadata.subtitle}
        pageSize="A4"
        author={metadata.author}
        date={metadata.date}
      >
        <div className="download-content-wrapper">
          <h1 className="text-xl">{metadata.title}</h1>
          <p className="italic">{metadata.subtitle}</p>

          {/* Start of Download Content */}
          <p>This is where the unique content for this download goes.</p>
          {/* End of Download Content */}
        </div>
      </BrandFrame>
    </>
  );
};

export default TheComponentName;
