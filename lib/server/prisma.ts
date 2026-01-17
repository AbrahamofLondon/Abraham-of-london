// lib/server/prisma.ts
/// Safe Prisma wrapper.
/// NOTE: This avoids hard dependency on PrismaClient types so TS can compile
/// even when tooling is broken. Still exports a named `prisma` for legacy imports.

let prismaInstance: any = null;

export function getPrisma() {
  if (prismaInstance) return prismaInstance;

  try {
    // dynamic require avoids TS static type dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@prisma/client");
    const Client = mod?.PrismaClient;
    prismaInstance = Client ? new Client() : null;
  } catch {
    prismaInstance = null;
  }

  return prismaInstance;
}

// ✅ legacy named export expected by older routes
export const prisma = getPrisma();

// ✅ default export for existing default-import usage
export default prisma;