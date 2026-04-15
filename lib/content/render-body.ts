console.log("[MODULE_INIT] lib/content/render-body");

/* lib/content/render-body.ts */

export type RenderBodyMode = "compiled" | "raw" | "empty";

export type RenderBodyResult = {
  code: string;
  mode: RenderBodyMode;
};

function asString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
}

function looksLikeCompiledMdx(value: string): boolean {
  if (!value) return false;

  return (
    /\bfunction\s+MDXContent\s*\(/.test(value) ||
    /\buseMDXComponents\b/.test(value) ||
    /\breturn\s+_jsx\s*\(/.test(value) ||
    /\breturn\s+_jsxs\s*\(/.test(value) ||
    /\b_jsx\s*\(/.test(value) ||
    /\b_jsxs\s*\(/.test(value) ||
    /\bjsxDEV\s*\(/.test(value) ||
    /react\/jsx-runtime/.test(value) ||
    /\/\*@jsxRuntime\s+automatic\*\//.test(value)
  );
}

function looksLikeLeakedModuleCode(value: string): boolean {
  if (!value) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(value) ||
    /\bmodule\.exports\b/.test(value) ||
    /\bexports\.[A-Za-z_$]/.test(value) ||
    /\b__esModule\b/.test(value) ||
    /\brequire\s*\(/.test(value)
  );
}

function looksLikeReadableText(value: string): boolean {
  if (!value) return false;
  if (looksLikeCompiledMdx(value)) return false;
  if (looksLikeLeakedModuleCode(value)) return false;

  return (
    /^#{1,6}\s+/m.test(value) ||
    /^\s*[-*+]\s+/m.test(value) ||
    /^\s*\d+\.\s+/m.test(value) ||
    /(^|\n)\s*>\s+/.test(value) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(value) ||
    /```[\s\S]*?```/.test(value) ||
    /\*\*[^*]+\*\*/.test(value) ||
    /^\|(.+)\|$/m.test(value) ||
    value.length > 80
  );
}

export function getRenderableBody(doc: any): RenderBodyResult {
  const bodyCode = asString(doc?.body?.code);
  const legacyBodyCode = asString(doc?.bodyCode);

  if (bodyCode && looksLikeCompiledMdx(bodyCode) && !looksLikeLeakedModuleCode(bodyCode)) {
    return { code: bodyCode, mode: "compiled" };
  }

  if (
    legacyBodyCode &&
    looksLikeCompiledMdx(legacyBodyCode) &&
    !looksLikeLeakedModuleCode(legacyBodyCode)
  ) {
    return { code: legacyBodyCode, mode: "compiled" };
  }

  const rawBody = asString(doc?.body?.raw);
  const content = asString(doc?.content);
  const mdx = asString(doc?.mdx);
  const stringBody = typeof doc?.body === "string" ? asString(doc.body) : "";

  const rawCandidate =
    rawBody ||
    content ||
    mdx ||
    stringBody;

  if (rawCandidate && looksLikeReadableText(rawCandidate)) {
    return { code: rawCandidate, mode: "raw" };
  }

  if (bodyCode && !looksLikeLeakedModuleCode(bodyCode)) {
    return { code: bodyCode, mode: "compiled" };
  }

  if (legacyBodyCode && !looksLikeLeakedModuleCode(legacyBodyCode)) {
    return { code: legacyBodyCode, mode: "compiled" };
  }

  return { code: "", mode: "empty" };
}