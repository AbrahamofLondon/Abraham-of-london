// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: Pagination;
  meta?: ApiMeta;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiMeta {
  timestamp: string;
  endpoint: string;
  source: 'pages-router' | 'app-router';
  version?: string;
  authenticated?: boolean;
  user?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

// Rate limiting
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
  identifier: 'ip' | 'userId';
}

// Unified API client
export class ApiClient {
  private baseUrl: string;
  private version: 'v1' | 'v2';
  
  constructor(version: 'v1' | 'v2' = 'v1') {
    this.version = version;
    this.baseUrl = version === 'v1' 
      ? process.env.NEXT_PUBLIC_API_V1_URL || '/api'
      : process.env.NEXT_PUBLIC_API_V2_URL || '/api/v2';
  }
  
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': this.version,
      },
      credentials: 'include',
    });
    
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': this.version,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    return response.json();
  }
}

// Export instances for convenience
export const apiV1 = new ApiClient('v1');
export const apiV2 = new ApiClient('v2');