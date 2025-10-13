// components/seo/BookJsonLd.tsx
import React from "react";
import Head from "next/head";

type Props = {
  title: string;
  author: string;
  image: string;
  description: string;
  genre?: string;
  isbn?: string;
  workExampleUrl?: string; // sample chapter
};

export default function BookJsonLd({
  title,
  author,
  image,
  description,
  genre,
  isbn,
  workExampleUrl,
}: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    author: { "@type": "Person", name: author },
    image,
    description,
    genre,
    isbn,
    workExample: workExampleUrl
      ? { "@type": "CreativeWork", url: workExampleUrl, encodingFormat: "application/pdf" }
      : undefined,
  };
  return (
    <Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Head>
  );
}
