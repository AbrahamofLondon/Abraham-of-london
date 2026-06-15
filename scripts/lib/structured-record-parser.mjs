/**
 * scripts/lib/structured-record-parser.mjs
 *
 * Structured record parser for TypeScript object literal arrays.
 *
 * Extracts records by field-owned identity — never by substring occurrence
 * in relationship fields (replaces, supersededBy, related, references, etc.).
 *
 * This prevents the class of bug where:
 *   lastIndexOf("GMI-Q1-2026") found the Q2 record because Q2 contains
 *   replaces: "GMI-Q1-2026"
 *
 * Usage:
 *   import { parseStructuredRecords } from "./lib/structured-record-parser.mjs";
 *   const records = parseStructuredRecords(filePath, {
 *     identityFields: ["id", "editionId", "productCode", "code", "slug"],
 *     skipFields: ["replaces", "supersededBy", "related", "references",
 *                  "archiveOf", "parent", "previous", "next", "nextExpected",
 *                  "currentUntil"],
 *   });
 *   const record = findRecordByIdentity(records, "GMI-Q1-2026");
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StructuredRecord
 * @property {string} sourceFile
 * @property {string} recordType
 * @property {Object} fields - All extracted key-value pairs
 * @property {string} raw - Raw text of the record block
 */

// ─── Identity field patterns ─────────────────────────────────────────────────

/** Fields that establish a record's own identity (never relationship refs). */
const DEFAULT_IDENTITY_FIELDS = [
  "id",
  "editionId",
  "productCode",
  "code",
  "slug",
  "contentId",
  "entitlementSlug",
  "documentId",
  "docId",
];

/** Fields that contain references to OTHER records (must not be used for identity). */
const DEFAULT_SKIP_FIELDS = [
  "replaces",
  "supersededBy",
  "related",
  "references",
  "archiveOf",
  "parent",
  "previous",
  "next",
  "nextExpected",
  "currentUntil",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract a string value for a given key from a text block.
 * Matches key: "value", key: 'value', or key: `value`.
 */
function extractStringValue(block, key) {
  const patterns = [
    new RegExp(`${key}\\s*:\\s*"([^"]*)"`, "m"),
    new RegExp(`${key}\\s*:\\s*'([^']*)'`, "m"),
    new RegExp(`${key}\\s*:\\s*\`([^\`]*)\``, "m"),
  ];
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Extract a boolean value for a given key from a text block.
 */
function extractBooleanValue(block, key) {
  const match = block.match(new RegExp(`${key}\\s*:\\s*(true|false)`, "m"));
  if (!match) return undefined;
  return match[1] === "true";
}

/**
 * Extract a nullable string value (supports `null` literal).
 */
function extractNullableString(block, key) {
  const quoted = extractStringValue(block, key);
  if (quoted !== undefined) return quoted;
  if (new RegExp(`${key}\\s*:\\s*null`, "m").test(block)) return null;
  return undefined;
}

/**
 * Find the matching closing brace for an opening brace at position `open`.
 */
function findMatchingBrace(text, open) {
  if (text[open] !== "{") return -1;
  let depth = 1;
  for (let i = open + 1; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * Parse a TypeScript file containing object literal arrays into structured records.
 *
 * @param {string} filePath - Relative path from project root
 * @param {string} fileContent - Raw file content
 * @param {Object} [options]
 * @param {string[]} [options.identityFields] - Fields that establish record identity
 * @param {string[]} [options.skipFields] - Fields that contain references to other records
 * @param {string} [options.recordType] - Type label for extracted records
 * @returns {StructuredRecord[]}
 */
export function parseStructuredRecords(filePath, fileContent, options = {}) {
  const identityFields = options.identityFields || DEFAULT_IDENTITY_FIELDS;
  const skipFields = options.skipFields || DEFAULT_SKIP_FIELDS;
  const recordType = options.recordType || "unknown";

  const records = [];

  // Strategy: find all top-level object literals by scanning for '{' at
  // the start of a line (after optional whitespace), then find matching '}'.
  // This is more reliable than regex-based approaches for nested objects.
  const lines = fileContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Look for opening brace that starts an object literal.
    // Handles both:
    //   {
    //   key: {
    //   key: {
    //     field: "value"
    //   }
    const braceIndex = line.indexOf("{");
    const hasBrace = braceIndex !== -1;
    // Skip lines where { is part of a type annotation, import, or function signature
    const isDataTypeLine = hasBrace && (
      trimmed === "{" ||
      trimmed.startsWith("{") ||
      /:\s*\{/.test(trimmed)  // key: {
    );

    if (isDataTypeLine) {
      const braceStart = braceIndex;
      const absoluteStart = getAbsoluteOffset(fileContent, i, braceStart);

      const close = findMatchingBrace(fileContent, absoluteStart);
      if (close !== -1) {
        const block = fileContent.slice(absoluteStart, close + 1);

        // Verify this is a data record (has at least one identity field pattern)
        const hasIdentityField = identityFields.some((field) => {
          const re = new RegExp(`(^|\\n)\\s*${field}\\s*:`, "m");
          return re.test(block);
        });

        if (hasIdentityField) {
          const record = extractRecord(filePath, block, recordType, identityFields, skipFields);
          if (record) {
            records.push(record);
          }
        }
      }
    }
    i++;
  }

  return records;
}

/**
 * Get absolute character offset from line number and column.
 */
function getAbsoluteOffset(text, lineIndex, columnIndex) {
  const lines = text.split("\n");
  let offset = 0;
  for (let j = 0; j < lineIndex; j++) {
    offset += lines[j].length + 1; // +1 for newline
  }
  return offset + columnIndex;
}

/**
 * Extract a structured record from a raw object literal block.
 */
function extractRecord(filePath, block, recordType, identityFields, skipFields) {
  const fields = {};

  // Extract all known fields from the block
  // Match patterns like:  fieldName: "value", fieldName: "value" as Type, fieldName: true, fieldName: null
  const fieldRe = /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:"([^"]*)"(?: as [a-zA-Z_$][a-zA-Z0-9_$<>[\]|, ]*)?|'([^']*)'(?: as [a-zA-Z_$][a-zA-Z0-9_$<>[\]|, ]*)?|`([^`]*)`(?: as [a-zA-Z_$][a-zA-Z0-9_$<>[\]|, ]*)?|(true|false|null)(?: as [a-zA-Z_$][a-zA-Z0-9_$<>[\]|, ]*)?|(\d+(?:\.\d+)?)(?: as [a-zA-Z_$][a-zA-Z0-9_$<>[\]|, ]*)?)/gm;
  let match;
  while ((match = fieldRe.exec(block)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6];
    if (value === "null") {
      fields[key] = null;
    } else if (value === "true") {
      fields[key] = true;
    } else if (value === "false") {
      fields[key] = false;
    } else if (/^\d+(\.\d+)?$/.test(value)) {
      fields[key] = Number(value);
    } else {
      fields[key] = value;
    }
  }

  // Also extract array fields (e.g., tags: [...], violationPatterns: [...])
  const arrayFieldRe = /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*\[([\s\S]*?)\]/gm;
  while ((match = arrayFieldRe.exec(block)) !== null) {
    const key = match[1];
    const arrayContent = match[2];
    const items = [];
    const itemRe = /"([^"]*)"|'([^']*)'/g;
    let im;
    while ((im = itemRe.exec(arrayContent)) !== null) {
      items.push(im[1] ?? im[2]);
    }
    if (items.length > 0) {
      fields[key] = items;
    }
  }

  // Determine identity from identity fields only
  const identityValues = [];
  for (const field of identityFields) {
    if (fields[field] !== undefined && fields[field] !== null) {
      identityValues.push(String(fields[field]));
    }
  }

  if (identityValues.length === 0) return null;

  return {
    sourceFile: filePath,
    recordType,
    fields,
    identity: identityValues,
    raw: block,
  };
}

// ─── Record finder ───────────────────────────────────────────────────────────

/**
 * Find a record by its own identity field values.
 * Only searches identity fields (id, code, slug, etc.),
 * never relationship fields (replaces, supersededBy, etc.).
 *
 * @param {StructuredRecord[]} records
 * @param {string} identity - The identity value to search for
 * @returns {StructuredRecord|undefined}
 */
export function findRecordByIdentity(records, identity) {
  const normalized = identity.toLowerCase().replace(/[-_\s]+/g, "_");
  return records.find((record) =>
    record.identity.some((id) => id.toLowerCase().replace(/[-_\s]+/g, "_") === normalized),
  );
}

/**
 * Find all records whose identity matches any of the given values.
 */
export function findRecordsByIdentities(records, identities) {
  const normalizedSet = new Set(
    identities.map((id) => id.toLowerCase().replace(/[-_\s]+/g, "_")),
  );
  return records.filter((record) =>
    record.identity.some((id) => normalizedSet.has(id.toLowerCase().replace(/[-_\s]+/g, "_"))),
  );
}

// ─── GMI-specific helpers ────────────────────────────────────────────────────

/**
 * Parse GMI lifecycle records from the lifecycle TypeScript file.
 * Uses field-owned identity extraction — never matches on relationship fields.
 *
 * @param {string} filePath
 * @param {string} content
 * @returns {StructuredRecord[]}
 */
export function parseGmiLifecycleRecords(filePath, content) {
  return parseStructuredRecords(filePath, content, {
    identityFields: ["id", "productCode"],
    skipFields: ["replaces", "supersededBy", "nextExpected", "currentUntil"],
    recordType: "gmi_lifecycle",
  });
}

/**
 * Parse GMI registry records from the registry TypeScript file.
 */
export function parseGmiRegistryRecords(filePath, content) {
  return parseStructuredRecords(filePath, content, {
    identityFields: ["editionId", "productCode"],
    skipFields: [],
    recordType: "gmi_registry",
  });
}

// ─── CATALOG parser ──────────────────────────────────────────────────────────

/**
 * Parse CATALOG entries from the catalog TypeScript file.
 */
export function parseCatalogRecords(filePath, content) {
  return parseStructuredRecords(filePath, content, {
    identityFields: ["code", "productCode"],
    skipFields: [],
    recordType: "catalog",
  });
}

// ─── Frontmatter parser ──────────────────────────────────────────────────────

/**
 * Parse frontmatter from an MDX/MD file.
 * Simple key: value parser (not a full YAML parser).
 */
export function parseFrontmatter(text) {
  if (!text.startsWith("---")) return { frontmatter: {}, body: text };

  const end = text.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: {}, body: text };

  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4);
  const frontmatter = {};

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, "");

    if (value === "true") frontmatter[key] = true;
    else if (value === "false") frontmatter[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) frontmatter[key] = Number(value);
    else frontmatter[key] = value;
  }

  return { frontmatter, body };
}
