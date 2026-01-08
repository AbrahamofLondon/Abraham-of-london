// pages/api/_env-debug.ts
export default function handler() {
  return new Response(
    JSON.stringify(
      Object.keys(process.env)
        .filter((k) => k.includes("PRISMA"))
        .reduce((acc, k) => ({ ...acc, [k]: process.env[k] }), {}),
      null,
      2
    ),
    { headers: { "content-type": "application/json" } }
  );
}