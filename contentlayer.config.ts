// Add this definition alongside the 'Download' definition

const Event = defineDocumentType(() => ({
  name: "Event",
  // Target your event files (adjust path as needed)
  filePathPattern: "events/*.mdx", 
  contentType: "mdx",
  fields: {
    // Crucial: Add 'date' and other fields required by pages/events/index.tsx
    title: { type: "string", required: true },
    date: { type: "string", required: true },
    
    // ✅ ADD THESE TWO MISSING FIELDS:
    ctaHref: { type: "string", required: false }, // Mismatch here caused the error
    ctaLabel: { type: "string", required: false },
    // ... all other event fields (endDate, location, summary, heroImage, tags)
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/events/${doc.slug}`, // Assuming you define 'slug' in fields
    },
  },
}));

// Then, update makeSource to include Event:
export default makeSource({
  contentDirPath: "content",
  documentTypes: [Download, Event /*, Post, etc. */], // Make sure Event is listed here!
  // ... rest of config
});