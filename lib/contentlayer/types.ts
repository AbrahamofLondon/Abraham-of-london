// Define DocumentTypes locally since it's not exported from contentlayer/generated
export type DocumentTypes = {
  // Add any common properties your documents share
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title?: string;
  description?: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
  published?: boolean;
  featured?: boolean;
  slug?: string;
  slugComputed?: string;
  coverImage?: string;
  image?: string;
  author?: string;
  readTime?: string;
  category?: string;
  body?: {
    raw: string;
    html?: string;
    code?: string;
  };
  [key: string]: any;
};

// If you need specific document types, you can define them here
export type Post = DocumentTypes & {
  type: "Post";
  readTime?: string;
  category?: string;
};

export type Book = DocumentTypes & {
  type: "Book";
  isbn?: string;
  publisher?: string;
};

export type Canon = DocumentTypes & {
  type: "Canon";
  volumeNumber?: number;
};

export type Download = DocumentTypes & {
  type: "Download";
  fileSize?: string;
  downloadUrl?: string;
};

export type Event = DocumentTypes & {
  type: "Event";
  location?: string;
  startDate?: string;
  endDate?: string;
};

export type Print = DocumentTypes & {
  type: "Print";
  price?: string;
  dimensions?: string;
};

export type Resource = DocumentTypes & {
  type: "Resource";
  resourceType?: string;
};

export type Short = DocumentTypes & {
  type: "Short";
  duration?: string;
  format?: "text" | "audio" | "video";
};

export type Strategy = DocumentTypes & {
  type: "Strategy";
  industry?: string;
  confidential?: boolean;
};