// lib/redis-enhanced.edge.ts
type StoredValue = { value: string; expiresAt?: number };

class MemoryRedis {
  private store = new Map<string, StoredValue>();

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }) {
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async setex(key: string, seconds: number, value: string) {
    return this.set(key, value, { EX: seconds });
  }

  async del(key: string) {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string) {
    const allKeys = Array.from(this.store.keys());
    if (pattern === "*") return allKeys;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return allKeys.filter((k) => regex.test(k));
  }

  async ping() {
    return "PONG";
  }

  async quit() {}

  async sadd(key: string, member: string) {
    const current = (await this.get(key)) || "[]";
    const set = new Set<string>(JSON.parse(current));
    set.add(member);
    await this.set(key, JSON.stringify(Array.from(set)));
    return 1;
  }

  async smembers(key: string) {
    const value = await this.get(key);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  async srem(key: string, member: string) {
    const current = (await this.get(key)) || "[]";
    const set = new Set<string>(JSON.parse(current));
    const existed = set.delete(member);
    if (existed) {
      await this.set(key, JSON.stringify(Array.from(set)));
      return 1;
    }
    return 0;
  }

  async mget(keys: string[]) {
    return Promise.all(keys.map((k) => this.get(k)));
  }

  async exists(key: string) {
    const v = await this.get(key);
    return v === null ? 0 : 1;
  }
}

export const redis = new MemoryRedis();
export default redis;
export type RedisInterface = typeof redis;
