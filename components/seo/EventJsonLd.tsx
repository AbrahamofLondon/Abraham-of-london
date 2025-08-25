export function EventJsonLd({
  name, startDate, endDate, location, url, image, description,
}: {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  url: string;
  image: string;
  description: string;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
    endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: location },
    image: [image],
    description,
    organizer: {
      "@type": "Organization",
      name: "Abraham of London",
      url: "https://abrahamoflondon.org",
    },
    url,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
