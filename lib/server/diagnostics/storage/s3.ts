/* lib/server/diagnostics/storage/s3.ts */
import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  DiagnosticStorageAdapter,
  DiagnosticStoredObject,
  PutStoredObjectInput,
  SignedObjectUrlResult,
} from "@/lib/server/diagnostics/storage/types";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function toS3Client(): S3Client {
  const region = process.env.DIAGNOSTIC_S3_REGION?.trim() || "auto";
  const endpoint = process.env.DIAGNOSTIC_S3_ENDPOINT?.trim() || undefined;
  const forcePathStyle = String(process.env.DIAGNOSTIC_S3_FORCE_PATH_STYLE || "")
    .toLowerCase()
    .trim();

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: forcePathStyle === "true",
    credentials: {
      accessKeyId: required("DIAGNOSTIC_S3_ACCESS_KEY_ID"),
      secretAccessKey: required("DIAGNOSTIC_S3_SECRET_ACCESS_KEY"),
    },
  });
}

function bucket(): string {
  return required("DIAGNOSTIC_S3_BUCKET");
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0);
  if (Buffer.isBuffer(stream)) return stream;
  if (typeof stream.transformToByteArray === "function") {
    const bytes = await stream.transformToByteArray();
    return Buffer.from(bytes);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class S3DiagnosticStorageAdapter implements DiagnosticStorageAdapter {
  provider = "s3" as const;
  private client = toS3Client();
  private bucketName = bucket();

  async putObject(input: PutStoredObjectInput): Promise<DiagnosticStoredObject> {
    const out = await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.contentType,
        ContentDisposition: input.fileName
          ? `inline; filename="${input.fileName.replace(/"/g, "")}"`
          : undefined,
        Metadata: input.sha256 ? { sha256: input.sha256 } : undefined,
      }),
    );

    return {
      provider: "s3",
      objectKey: input.objectKey,
      bucket: this.bucketName,
      contentType: input.contentType,
      byteLength: input.body.length,
      fileName: input.fileName ?? null,
      sha256: input.sha256 ?? null,
      etag: out.ETag ?? null,
    };
  }

  async getObjectBuffer(objectKey: string): Promise<Buffer | null> {
    try {
      const out = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );

      return await streamToBuffer(out.Body);
    } catch {
      return null;
    }
  }

  async deleteObject(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSignedReadUrl(objectKey: string, fileName?: string | null): Promise<SignedObjectUrlResult | null> {
    try {
      const expiresInSeconds = Number(process.env.DIAGNOSTIC_SIGNED_URL_TTL_SECONDS || 900);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        ResponseContentDisposition: fileName
          ? `inline; filename="${fileName.replace(/"/g, "")}"`
          : undefined,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });

      return {
        url,
        expiresInSeconds,
      };
    } catch {
      return null;
    }
  }

  async exists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}