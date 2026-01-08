// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// IMPORTANT:
// - Keep this file tiny.
// - No Prisma imports here.
// - No heavy runtime decisions.
// This prevents “collect page data” and bundling landmines.

export default NextAuth(authOptions);
export { authOptions };