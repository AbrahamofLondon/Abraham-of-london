/* eslint-disable no-console */
/**
 * Database abstraction layer for the application.
 * Handles different database configurations and fallbacks.
 */

export interface DatabaseConfig {
  type: 'redis' | 'postgres' | 'memory' | 'prisma';
  url?: string;
  connection?: any;
  connected: boolean;
  lastHealthCheck?: Date;
}

export interface DatabaseStats {
  connections: number;
  activeConnections: number;
  memoryUsage?: string;
  uptime?: number;
  lastError?: string;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  queryTime?: number;
  rowsAffected?: number;
}

// Memory storage fallback
class MemoryDatabase {
  private store = new Map<string, any>();
  private collections = new Map<string, Map<string, any>>();
  private connected = true;

  async connect(): Promise<boolean> {
    this.connected = true;
    console.log('[MemoryDB] Connected to in-memory storage');
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[MemoryDB] Disconnected');
  }

  async query<T = any>(query: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      const startTime = Date.now();
      
      // Parse simple query patterns
      if (query.toLowerCase().includes('select')) {
        // For SELECT queries, check collections
        const collectionMatch = query.match(/from\s+(\w+)/i);
        if (collectionMatch) {
          const collectionName = collectionMatch[1];
          const collection = this.collections.get(collectionName);
          
          if (!collection) {
            return {
              success: true,
              data: [] as T,
              queryTime: Date.now() - startTime,
              rowsAffected: 0
            };
          }
          
          // Convert to array
          const data = Array.from(collection.values());
          return {
            success: true,
            data: data as T,
            queryTime: Date.now() - startTime,
            rowsAffected: data.length
          };
        }
      } else if (query.toLowerCase().includes('insert')) {
        // For INSERT queries
        const tableMatch = query.match(/into\s+(\w+)/i);
        if (tableMatch && params && params[0]) {
          const tableName = tableMatch[1];
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const record = { id, ...params[0] };
          
          let collection = this.collections.get(tableName);
          if (!collection) {
            collection = new Map();
            this.collections.set(tableName, collection);
          }
          
          collection.set(id, record);
          
          return {
            success: true,
            data: record as T,
            queryTime: Date.now() - startTime,
            rowsAffected: 1
          };
        }
      } else if (query.toLowerCase().includes('update')) {
        // For UPDATE queries
        return {
          success: true,
          data: {} as T,
          queryTime: Date.now() - startTime,
          rowsAffected: 0
        };
      }
      
      return {
        success: true,
        data: [] as T,
        queryTime: Date.now() - startTime,
        rowsAffected: 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        queryTime: 0
      };
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: any): Promise<boolean> {
    this.store.set(key, value);
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async healthCheck(): Promise<boolean> {
    return this.connected;
  }

  async getStats(): Promise<DatabaseStats> {
    return {
      connections: 1,
      activeConnections: 1,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      uptime: process.uptime()
    };
  }

  async createCollection(name: string): Promise<boolean> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.collections.clear();
  }
}

// Database factory with Prisma support
class Database {
  private static instance: Database;
  private config: DatabaseConfig;
  private db: MemoryDatabase | null = null;
  private prismaClient: any = null;
  private initialized = false;

  private constructor() {
    // Determine database type from environment
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres')) {
      this.config = {
        type: 'prisma',
        url: process.env.DATABASE_URL,
        connected: false
      };
    } else {
      this.config = {
        type: 'memory',
        connected: true
      };
    }
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.config.type === 'prisma') {
        // Try to initialize Prisma
        try {
          // Use dynamic import for Edge runtime compatibility
          if (typeof window === 'undefined') {
            const { PrismaClient } = await import('@prisma/client');
            this.prismaClient = new PrismaClient({
              log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
            });
            
            // Test connection
            await this.prismaClient.$queryRaw`SELECT 1`;
            this.config.connected = true;
            console.log('[Database] Connected to Prisma/PostgreSQL');
          } else {
            throw new Error('Prisma not available in browser');
          }
        } catch (prismaError) {
          console.warn('[Database] Prisma connection failed:', prismaError);
          console.warn('[Database] Falling back to memory storage');
          this.db = new MemoryDatabase();
          this.config.type = 'memory';
          await this.db.connect();
        }
      } else {
        this.db = new MemoryDatabase();
        await this.db.connect();
      }
      
      this.initialized = true;
      this.config.lastHealthCheck = new Date();
      
      console.log(`[Database] Initialized with ${this.config.type} storage`);
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
      this.db = new MemoryDatabase();
      await this.db.connect();
      this.config.type = 'memory';
      this.config.connected = true;
      this.initialized = true;
    }
  }

  async query<T = any>(query: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.prismaClient) {
      try {
        const startTime = Date.now();
        // Note: Prisma doesn't support raw SQL queries without proper setup
        // This is a simplified implementation
        return {
          success: true,
          data: [] as T,
          queryTime: Date.now() - startTime,
          rowsAffected: 0
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Query failed',
          queryTime: 0
        };
      }
    }

    if (this.db) {
      return await this.db.query<T>(query, params);
    }

    return {
      success: false,
      error: 'Database not initialized'
    };
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      return await this.db.get<T>(key);
    }

    return null;
  }

  async set(key: string, value: any): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      return await this.db.set(key, value);
    }

    return false;
  }

  async delete(key: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      return await this.db.delete(key);
    }

    return false;
  }

  async exists(key: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      return await this.db.exists(key);
    }

    return false;
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    type: string;
    responseTime: number;
    error?: string;
    stats?: DatabaseStats;
  }> {
    const startTime = Date.now();
    
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        return {
          healthy: false,
          type: this.config.type,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Initialization failed'
        };
      }
    }

    if (this.prismaClient) {
      try {
        await this.prismaClient.$queryRaw`SELECT 1`;
        this.config.connected = true;
        this.config.lastHealthCheck = new Date();
        
        return {
          healthy: true,
          type: this.config.type,
          responseTime: Date.now() - startTime,
          stats: {
            connections: 1,
            activeConnections: 1,
            uptime: process.uptime()
          }
        };
      } catch (error) {
        this.config.connected = false;
        return {
          healthy: false,
          type: this.config.type,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Health check failed'
        };
      }
    }

    if (this.db) {
      try {
        const healthy = await this.db.healthCheck();
        this.config.connected = healthy;
        this.config.lastHealthCheck = new Date();

        const stats = await this.db.getStats();

        return {
          healthy,
          type: this.config.type,
          responseTime: Date.now() - startTime,
          stats
        };
      } catch (error) {
        this.config.connected = false;
        return {
          healthy: false,
          type: this.config.type,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Health check failed'
        };
      }
    }

    return {
      healthy: false,
      type: this.config.type,
      responseTime: Date.now() - startTime,
      error: 'Database instance not available'
    };
  }

  async getStats(): Promise<DatabaseStats> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      return await this.db.getStats();
    }

    if (this.prismaClient) {
      return {
        connections: 1,
        activeConnections: 1,
        uptime: process.uptime()
      };
    }

    return {
      connections: 0,
      activeConnections: 0,
      lastError: 'Statistics not available'
    };
  }

  async createCollection(name: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      return await this.db.createCollection(name);
    }

    return false;
  }

  async clear(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.db) {
      await this.db.clear();
    }
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  isRedis(): boolean {
    return process.env.REDIS_URL !== undefined;
  }

  isPostgres(): boolean {
    return this.config.type === 'prisma' && this.config.connected;
  }

  isMemory(): boolean {
    return this.config.type === 'memory';
  }

  // Get Prisma client if available
  getPrismaClient(): any {
    return this.prismaClient;
  }
}

// Export singleton instance
const db = Database.getInstance();

// Helper functions
export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  const result = await db.query<T>(query, params);
  if (!result.success) {
    throw new Error(result.error || 'Query failed');
  }
  return result.data || [];
}

export async function executeSingle<T = any>(query: string, params?: any[]): Promise<T | null> {
  const result = await db.query<T>(query, params);
  if (!result.success) {
    throw new Error(result.error || 'Query failed');
  }
  if (Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0];
  }
  return null;
}

export async function executeUpdate(query: string, params?: any[]): Promise<number> {
  const result = await db.query(query, params);
  if (!result.success) {
    throw new Error(result.error || 'Update failed');
  }
  return result.rowsAffected || 0;
}

// Health check endpoint helper
export async function getDatabaseHealth() {
  return await db.healthCheck();
}

// Get Prisma client
export async function getPrismaClient() {
  await db.initialize();
  return db.getPrismaClient();
}

// Check database connection (for compatibility with imports)
export async function checkDatabaseConnection() {
  const health = await db.healthCheck();
  return {
    connected: health.healthy,
    error: health.error,
    type: health.type
  };
}

// Initialize on import for convenience
db.initialize().catch(console.error);

// Export everything for compatibility
export default db;
export { db };

// Export types for external use
export type {
  DatabaseConfig,
  DatabaseStats,
  QueryResult
};
