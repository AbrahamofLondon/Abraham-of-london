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
  title: string;
  date: string;
  slug: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;
  author?: string;
  coverImage?: string;
  volumeNumber?: string;
  order?: number;
  featured?: boolean;
  draft?: boolean;
  tags?: string[];
  readTime?: string;
  accessLevel?: string;
  lockMessage?: string;
  body: {
    raw: string;
    code: string;
  };
  url: string;
}
