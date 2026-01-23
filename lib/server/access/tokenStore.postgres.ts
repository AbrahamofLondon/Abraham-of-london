import type { TokenStore } from "./tokenStore";

export async function createPostgresTokenStore(): Promise<TokenStore> {
  throw new Error("Postgres tokenStore not enabled yet. Reply: `2: Postgres` and I’ll implement it cleanly.");
}