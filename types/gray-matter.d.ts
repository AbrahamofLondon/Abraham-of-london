declare module "gray-matter" {
  export interface GrayMatterFile<T extends Record<string, unknown> = Record<string, unknown>> {
    data: T;
    content: string;
    excerpt?: string;
    orig?: unknown;
  }
  function matter(input: string | Buffer, options?: Record<string, unknown>): GrayMatterFile;
  export default matter;
}