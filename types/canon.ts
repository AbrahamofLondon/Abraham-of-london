// types/canon.ts

export interface CanonDoc {
  _id: string;
  _raw: {
    flattenedPath: string;
    sourceFileName: string;
    sourceFileDir: string;
    sourceFilePath: string;
  };

  type: "Canon";

  // Core
  title: string;
  date: string;
  slug: string;

  // Presentation
  subtitle?: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  volumeNumber?: string;
  order?: number;
  featured?: boolean;
  readTime?: string;

  // Editorial
  author?: string;
  draft?: boolean;
  tags?: string[];

  // Access control
  accessLevel?: string;
  lockMessage?: string;

  // Body
  body: {
    raw: string;
    code: string;
  };

  url: string;
}
