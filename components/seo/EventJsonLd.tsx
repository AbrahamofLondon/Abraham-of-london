import React from "react";

export type EventJsonLdProps = {
  name: string;
  startDate: string;         // ISO
  endDate?: string;          // ISO
  eventStatus?: string;      // e.g., "https://schema.org/EventScheduled"
  eventAttendanceMode?: string; // e.g., "https://schema.org/OfflineEventAttendanceMode"
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
  offers?: any[];
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
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
