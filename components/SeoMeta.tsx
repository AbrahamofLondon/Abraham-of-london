// components/SeoMeta.tsx
import Head from "next/head";

interface SeoMetaProps {
  title: string;
  description: string;
  coverImage: string;
  url: string;
}

export default function SeoMeta({
  title,
  description,
  coverImage,
  url,
}: SeoMetaProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={coverImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={coverImage} />
    </Head>
  );
}




