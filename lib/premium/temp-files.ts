// lib/premium/temp-files.ts
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { logger } from "@/lib/logging";

const MAX_TEMP_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const TEMP_FILE_PREFIX = "aol-premium";
const TEMP_FILE_SUFFIX = ".pdf";

function sanitizePrefix(prefix: string): string {
  const cleaned = prefix.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || TEMP_FILE_PREFIX;
}

function isWithinDirectory(filePath: string, directory: string): boolean {
  const relative = path.relative(directory, filePath);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

/**
 * Creates a secure temporary PDF file path with collision resistance.
 */
export function createTempPdfPath(prefix = TEMP_FILE_PREFIX): string {
  const tempDir = os.tmpdir();
  const safePrefix = sanitizePrefix(prefix);
  const randomPart = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const filename = `${safePrefix}-${timestamp}-${randomPart}${TEMP_FILE_SUFFIX}`;

  return path.join(tempDir, filename);
}

/**
 * Writes a buffer to a temp file with safety checks.
 * Throws if the file already exists or size exceeds the limit.
 */
export async function writeTempFile(
  filePath: string,
  buffer: Buffer,
): Promise<void> {
  if (!filePath) {
    throw new Error("File path is required");
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Buffer is required");
  }

  if (buffer.length > MAX_TEMP_FILE_SIZE) {
    throw new Error(
      `File size ${buffer.length} exceeds maximum ${MAX_TEMP_FILE_SIZE} bytes`,
    );
  }

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    throw new Error(`Temporary file already exists: ${filePath}`);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : null;

    if (code && code !== "ENOENT") {
      throw error;
    }
  }

  await fs.promises.writeFile(filePath, buffer, {
    mode: 0o600,
    flag: "wx",
  });
}

/**
 * Safely deletes a temp file.
 * Returns true if the file was deleted or already absent.
 */
export async function deleteTempFile(filePath: string): Promise<boolean> {
  if (!filePath) return false;

  try {
    const normalizedPath = path.resolve(filePath);
    const tempDir = path.resolve(os.tmpdir());

    if (!isWithinDirectory(normalizedPath, tempDir)) {
      logger.warn("[TEMP_FILE] Refused to delete file outside temp directory", {
        filePath,
        normalizedPath,
        tempDir,
      });
      return false;
    }

    await fs.promises.unlink(normalizedPath);

    logger.debug("[TEMP_FILE] Deleted temp file", {
      fileName: path.basename(normalizedPath),
    });

    return true;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : null;

    if (code === "ENOENT") {
      return true;
    }

    logger.error("[TEMP_FILE] Failed to delete temp file", {
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Creates a temp file descriptor with an explicit cleanup function.
 */
export function createSelfDestructingTempFile(): {
  path: string;
  cleanup: () => Promise<void>;
} {
  const filePath = createTempPdfPath();

  const cleanup = async (): Promise<void> => {
    await deleteTempFile(filePath);
  };

  return { path: filePath, cleanup };
}

/**
 * Writes a temp file, runs a function against it, then guarantees cleanup.
 */
export async function withTempFile<T>(
  buffer: Buffer,
  fn: (filePath: string) => Promise<T>,
): Promise<T> {
  const filePath = createTempPdfPath();

  try {
    await writeTempFile(filePath, buffer);
    return await fn(filePath);
  } finally {
    await deleteTempFile(filePath);
  }
}