// lib/server/inner-circle.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: any;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface QueryOptions {
  timeout?: number;
  transaction?: boolean;
  isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable';
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  fields?: Array<{ name: string }>;
}

export interface Transaction {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// ============================================================================
// DATABASE CLIENT
// ============================================================================

/**
 * Robust Database Client with connection pooling, transactions, and error handling
 */
export class DatabaseClient {
  private static pool: any = null;
  private static config: DatabaseConfig = {};
  private static isInitialized = false;

  // ==========================================================================
  // CORE METHODS
  // ==========================================================================

  /**
   * Initialize the database connection pool
   */
  static async initialize(config: DatabaseConfig = {}): Promise<void> {
    if (this.isInitialized) {
      console.warn('DatabaseClient already initialized');
      return;
    }

    try {
      const { Pool } = await import('pg');
      
      // HARDCODED NEON CREDENTIALS (your actual Neon connection)
      const neonConnectionString = 'postgresql://neondb_owner:npg_lVTc95DapNuM@ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech/abraham_of_london?sslmode=require';
      
      console.log('🔗 DatabaseClient connecting to Neon...');
      console.log('  Host: ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech');
      console.log('  Database: abraham_of_london');
      
      // Use hardcoded Neon config
      this.config = {
        connectionString: neonConnectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        ...config
      };

      // Create connection pool
      this.pool = new Pool(this.config);

      // Test connection
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT NOW() as now, current_database() as db');
        console.log('✅ Connected to Neon as:', result.rows[0].db);
        console.log('   Server time:', result.rows[0].now);
      } finally {
        client.release();
      }

      // Set up error handling
      this.pool.on('error', (err: Error) => {
        console.error('Database pool error:', err);
      });

      this.isInitialized = true;
      console.log('✅ DatabaseClient initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize DatabaseClient:', error);
      console.log('⚠️  Running in stub mode - no real database connection');
      this.isInitialized = true; // Prevent retry loops
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  static async getClient(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // If pool failed to initialize, return a stub
    if (!this.pool) {
      console.warn('⚠️  DatabaseClient running in stub mode (no real pool)');
      return {
        query: async () => ({ rows: [], rowCount: 0 }),
        release: () => {}
      };
    }
    
    try {
      return await this.pool.connect();
    } catch (error) {
      console.error('Failed to get database client:', error);
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   */
  static async query<T = any>(
    operation: string,
    sql: string,
    params: any[] = [],
    defaultValue: T | null = null,
    options: QueryOptions = {}
  ): Promise<T | T[] | null> {
    // If pool is not initialized properly, return default value
    if (!this.pool) {
      console.warn(`⚠️  Query '${operation}' running in stub mode`);
      return defaultValue;
    }

    const startTime = Date.now();
    const client = await this.getClient();
    
    try {
      if (options.timeout) {
        await client.query(`SET LOCAL statement_timeout = ${options.timeout}`);
      }

      const result = await client.query(sql, params);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`⚠️ Slow query (${duration}ms): ${operation}`);
      }

      // Return appropriate data based on query type
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        if (result.rows.length === 0) {
          return defaultValue;
        } else if (result.rows.length === 1 && !sql.includes('LIMIT') && !sql.toUpperCase().includes('COUNT(')) {
          return result.rows[0] as T;
        }
        return result.rows as T[];
      } else {
        // For INSERT/UPDATE/DELETE, return the affected rows
        return result.rowCount as any;
      }
    } catch (error) {
      console.error(`❌ Database query failed (${operation}):`, {
        error: error instanceof Error ? error.message : error,
        sql,
        params,
        duration: Date.now() - startTime
      });
      
      // Return defaultValue on error
      return defaultValue;
    } finally {
      if (client && client.release) {
        client.release();
      }
    }
  }

  // ==========================================================================
  // ADVANCED OPERATIONS
  // ==========================================================================

  /**
   * Execute a transaction
   */
  static async transaction<T>(
    callback: (tx: Transaction) => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    if (!this.pool) {
      console.warn('⚠️  Transaction running in stub mode');
      // Create a stub transaction object
      const stubTx: Transaction = {
        query: async () => ({ rows: [], rowCount: 0, command: '' }),
        commit: async () => {},
        rollback: async () => {}
      };
      return callback(stubTx);
    }

    const client = await this.getClient();
    
    try {
      // Begin transaction
      if (options.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }
      await client.query('BEGIN');

      // Create transaction object
      const tx: Transaction = {
        query: async <R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> => {
          return await client.query(sql, params);
        },
        commit: async () => {
          await client.query('COMMIT');
          client.release();
        },
        rollback: async () => {
          await client.query('ROLLBACK');
          client.release();
        }
      };

      // Execute callback
      const result = await callback(tx);
      
      // Commit transaction
      await tx.commit();
      return result;
    } catch (error) {
      // Rollback on error
      try {
        await client.query('ROLLBACK');
        client.release();
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
      
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Batch execute multiple queries
   */
  static async batch(
    queries: Array<{ operation: string; sql: string; params?: any[] }>,
    options: QueryOptions = {}
  ): Promise<Array<any>> {
    if (!this.pool) {
      console.warn('⚠️  Batch query running in stub mode');
      return queries.map(() => []);
    }

    const client = await this.getClient();
    
    try {
      if (options.transaction) {
        await client.query('BEGIN');
      }

      const results = [];
      for (const query of queries) {
        const result = await client.query(query.sql, query.params || []);
        results.push(result.rows);
      }

      if (options.transaction) {
        await client.query('COMMIT');
      }

      return results;
    } catch (error) {
      if (options.transaction) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Failed to rollback batch transaction:', rollbackError);
        }
      }
      
      console.error('Batch query failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ==========================================================================
  // ADMINISTRATIVE METHODS
  // ==========================================================================

  /**
   * Check database health
   */
  static async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // If no pool, we're in stub mode
      if (!this.pool) {
        return {
          healthy: false,
          latency: Date.now() - startTime,
          error: 'Database running in stub mode (no real connection)'
        };
      }

      const result = await this.query<any>(
        'healthCheck',
        'SELECT 1 as status, NOW() as timestamp',
        [],
        null
      );

      const latency = Date.now() - startTime;
      
      return {
        healthy: result?.status === 1,
        latency,
        error: result ? undefined : 'No response from database'
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Close the database connection pool
   */
  static async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('Database connection pool closed');
      } catch (error) {
        console.error('Error closing database pool:', error);
      } finally {
        this.pool = null;
        this.isInitialized = false;
      }
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert to ISO date string
 */
export function toIso(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  return date.toISOString();
}

/**
 * Safely parse integer with fallback
 */
export function toInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely parse float with fallback
 */
export function toFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Convert to boolean
 */
export function toBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

/**
 * Sanitize string for database queries
 */
export function sanitizeString(str: string): string {
  return str.replace(/[^\w\s\-.,@]/gi, '').trim();
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
    day: 'numeric',
  };

  if (format === 'full') {
    options.weekday = 'long';
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return dateObj.toLocaleDateString('en-GB', options);
}

/**
 * Generate pagination metadata
 */
export function getPaginationMeta(
  total: number,
  page: number = 1,
  perPage: number = 10
): {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  const totalPages = Math.ceil(total / perPage);
  
  return {
    total,
    page: Math.max(1, Math.min(page, totalPages)),
    perPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  };
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined,
  defaultValue: T
): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Stringify JSON safely
 */
export function safeJsonStringify(
  data: any,
  indent: number = 2
): string {
  try {
    return JSON.stringify(data, null, indent);
  } catch {
    return '{}';
  }
}

// ============================================================================
// TYPE GUARDS AND VALIDATION
// ============================================================================

export const TypeGuards = {
  isString: (value: any): value is string => typeof value === 'string',
  isNumber: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: any): value is boolean => typeof value === 'boolean',
  isArray: (value: any): value is any[] => Array.isArray(value),
  isObject: (value: any): value is Record<string, any> => 
    value !== null && typeof value === 'object' && !Array.isArray(value),
  isDate: (value: any): value is Date => value instanceof Date && !isNaN(value.getTime()),
  isNullOrUndefined: (value: any): value is null | undefined => 
    value === null || value === undefined
};

// ============================================================================
// ENVIRONMENT CONFIGURATION HELPER
// ============================================================================

/**
 * Environment configuration helper
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

// Note: We're not re-exporting the interfaces in the default object
// because TypeScript interfaces are compile-time only and can't be
// included in runtime JavaScript objects.

const innerCircleExports = {
  // Core
  DatabaseClient,
  
  // Utilities
  toIso,
  toInt,
  toFloat,
  toBool,
  sanitizeString,
  formatDate,
  getPaginationMeta,
  safeJsonParse,
  safeJsonStringify,
  
  // Type Guards
  TypeGuards,
  
  // Environment
  getEnvVar
};

export default innerCircleExports;