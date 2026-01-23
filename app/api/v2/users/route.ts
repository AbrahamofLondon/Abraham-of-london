// app/api/v2/users/route.ts - CORRECTED (remove updatedAt)
import { NextRequest, NextResponse } from 'next/server';
import { prisma, safePrismaQuery } from '@/lib/prisma';

// Helper to forward requests to v1 API
async function forwardToV1(request: NextRequest, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || 'https://www.abrahamoflondon.org'
      : 'http://localhost:3000';
    
    // Validate prisma connection before proceeding (but don't throw if it fails)
    try {
      await prisma.$connect();
    } catch (prismaError) {
      console.warn('[Users API v2] Prisma connection warning:', prismaError);
      // Continue without prisma - we're just forwarding anyway
    }
    
    const v1Url = `${baseUrl}/api/v1/users`;
    
    // Prepare headers for forwarding
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Version': 'v2',
      'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      'User-Agent': request.headers.get('user-agent') || 'v2-forwarder',
    };
    
    // Add auth headers if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };
    
    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(v1Url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Users API v2] V1 API error: ${response.status}`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch users from v1 API',
          status: response.status,
          message: errorText 
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Log the successful request using safePrismaQuery
    try {
      await safePrismaQuery(() => 
        prisma.apiLog.create({
          data: {
            endpoint: '/api/v2/users',
            method,
            statusCode: response.status,
            userAgent: request.headers.get('user-agent') || 'unknown',
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            responseTime: 0,
          }
        })
      );
    } catch (logError) {
      console.warn('[Users API v2] Failed to log request:', logError);
      // Don't fail the request if logging fails
    }
    
    return NextResponse.json(data, {
      headers: {
        'X-API-Version': 'v2',
        'X-API-Router': 'app',
        'X-Forwarded-From': 'v1',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    console.error('[Users API v2] Forwarding error:', error);
    
    // Try to use prisma directly as fallback if v1 API fails
    try {
      // Check if we have a innerCircleMember model (your schema has InnerCircleMember, not User)
      const hasUserModel = 'innerCircleMember' in prisma;
      if (!hasUserModel) {
        throw new Error('User model not available in Prisma schema');
      }
      
      const usersResult = await safePrismaQuery(() => 
        prisma.innerCircleMember.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            tier: true,
            createdAt: true,
            lastSeenAt: true,  // REMOVED: updatedAt (not in your schema)
          },
          take: 50,
          orderBy: { createdAt: 'desc' }
        })
      );
      
      // Type guard: Ensure we have a valid array
      if (!usersResult || !Array.isArray(usersResult)) {
        throw new Error('Invalid user data returned from database');
      }
      
      const users = usersResult as Array<{
        id: string;
        email: string | null;
        name: string | null;
        status: string;
        tier: string;
        createdAt: Date;
        lastSeenAt: Date;  // REMOVED: updatedAt
      }>;
      
      return NextResponse.json({
        data: users,
        meta: {
          source: 'fallback-direct-db',
          count: users.length,
          warning: 'V1 API unavailable, using InnerCircleMember database fallback'
        }
      }, {
        status: 200,
        headers: {
          'X-API-Version': 'v2',
          'X-API-Router': 'app',
          'X-Fallback': 'true',
        }
      });
      
    } catch (dbError) {
      console.error('[Users API v2] Database fallback also failed:', dbError);
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'X-API-Version': 'v2',
            'X-API-Router': 'app',
            'X-Error': 'true',
          }
        }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  // Extract query parameters if needed
  const searchParams = request.nextUrl.searchParams;
  const _query = Object.fromEntries(searchParams.entries());
  
  // You could process the query here before forwarding
  // For now, just forward to v1
  return forwardToV1(request, 'GET');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: email and name are required' },
        { status: 400 }
      );
    }
    
    return forwardToV1(request, 'POST', body);
    
  } catch (error) {
    console.error('[Users API v2] POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.id) {
      return NextResponse.json(
        { error: 'Invalid request: id is required for updates' },
        { status: 400 }
      );
    }
    
    return forwardToV1(request, 'PUT', body);
    
  } catch (error) {
    console.error('[Users API v2] PUT error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required for deletion' },
        { status: 400 }
      );
    }
    
    return forwardToV1(request, 'DELETE');
    
  } catch (error) {
    console.error('[Users API v2] DELETE error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// API configuration
export const dynamic = 'force-dynamic';
export const runtime = 'edge';