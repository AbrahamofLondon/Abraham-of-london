import * as React from "react";

type EventJsonLdProps = {
  name: string;
  startDate: string;       // ISO string
  endDate?: string;
  description?: string;
  url?: string;
  images?: string[];
  image?: string | string[];
  eventStatus?: string;          // e.g. "https://schema.org/EventScheduled"
  eventAttendanceMode?: string;  // e.g. "https://schema.org/OfflineEventAttendanceMode"
  location?: unknown;            // pass your object from MDX (Place/VirtualLocation)
  organizer?: unknown;           // Organization/Person
  offers?: unknown;              // Offer | Offer[]
  performer?: unknown;           // Person | Organization | (array)
};

export default function EventJsonLd(props: EventJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: props.name,
    startDate: props.startDate,
  };

  const set = (k: string, v: unknown) => {
    if (v == null) return;
    if (Array.isArray(v) && v.length === 0) return;
    (data as any)[k] = v;
  };

  const imgs =
    props.images ??
    (Array.isArray(props.image) ? props.image : props.image ? [props.image] : undefined);

  set("endDate", props.endDate);
  set("description", props.description);
  set("url", props.url);
  set("image", imgs);
  set("eventStatus", props.eventStatus);
  set("eventAttendanceMode", props.eventAttendanceMode);
  set("location", props.location);
  set("organizer", props.organizer);
  set("offers", props.offers);
  set("performer", props.performer);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
