import React from "react";

export interface EventOffer {
  "@type": "Offer";
  url?: string;
  price?: string | number;
  priceCurrency?: string;
  availability?: string;
  validFrom?: string;
  description?: string;
}

export type EventJsonLdProps = {
  name: string;
  startDate: string;
  endDate?: string;
  eventStatus?: string;
  eventAttendanceMode?: string;
  location: {
    "@type": "Place";
    name: string;
    address?: string | {
      "@type": "PostalAddress";
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
  };
  image?: string | string[];
  description?: string;
  organizer?: { "@type": "Organization" | "Person"; name: string; url?: string };
  offers?: EventOffer[];
  url?: string;
};

export default function EventJsonLd(props: EventJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    ...props,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}