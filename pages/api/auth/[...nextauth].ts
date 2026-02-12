import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Institutional Note: Explicitly export authOptions so other API routes can 
// import it from this location as a named export.
export { authOptions };

export default NextAuth(authOptions);