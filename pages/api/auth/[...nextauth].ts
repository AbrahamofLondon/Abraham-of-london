import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Institutional Note: Keep logic in @/lib/auth to avoid build-time bundling loops.
export default NextAuth(authOptions);