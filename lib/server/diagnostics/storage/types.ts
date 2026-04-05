/* lib/server/diagnostics/storage/types.ts */

export type DiagnosticStorageProvider = "local" | "s3";

export type DiagnosticStoredObject = {
  provider: DiagnosticStorageProvider;
  objectKey: string;
  bucket?: string | null;
  contentType: string;
  byteLength: number;
  etag?: string | null;
  sha256?: string | null;
  fileName?: string | null;
};

export type PutStoredObjectInput = {
  objectKey: string;
  contentType: string;
  body: Buffer;
  fileName?: string | null;
  sha256?: string | null;
};

export type SignedObjectUrlResult = {
  url: string;
  expiresInSeconds: number;
};

export interface DiagnosticStorageAdapter {
  provider: DiagnosticStorageProvider;
  putObject(input: PutStoredObjectInput): Promise<DiagnosticStoredObject>;
  getObjectBuffer(objectKey: string): Promise<Buffer | null>;
  deleteObject(objectKey: string): Promise<boolean>;
  getSignedReadUrl(objectKey: string, fileName?: string | null): Promise<SignedObjectUrlResult | null>;
  exists(objectKey: string): Promise<boolean>;
}