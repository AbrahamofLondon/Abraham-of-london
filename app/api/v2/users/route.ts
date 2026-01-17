import { NextRequest, NextResponse } from 'next/server';
import { prisma, safePrismaQuery } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Forward to Pages Router API with proper URL construction
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.abrahamoflondon.org'
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/v1/users`, {
      headers: Object.fromEntries(request.headers),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'X-API-Version': 'v2',
        'X-API-Router': 'app',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.abrahamoflondon.org'
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers)
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-API-Version': 'v2',
        'X-API-Router': 'app',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
