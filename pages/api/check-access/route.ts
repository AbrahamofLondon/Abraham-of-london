// app/api/check-access/route.ts - PRODUCTION-READY
import { NextRequest, NextResponse } from 'next/server';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // Ensure fresh checks
export const revalidate = 0; // No caching

export async function GET(request: NextRequest) {
  try {
    // Get headers from the request
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    
    // Get cookies
    const cookieHeader = headersList.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    
    // Create request-like object
    const mockReq = {
      headers: {
        'user-agent': userAgent,
      },
      cookies: {
        innerCircleAccess: cookies.innerCircleAccess || '',
        // Add other relevant cookies if needed
        ...cookies,
      },
      ip: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
    };
    
    const accessResult = getInnerCircleAccess(mockReq as any);
    
    // Ensure response matches the InnerCircleAccess type
    const validatedResult: InnerCircleAccess = {
      hasAccess: accessResult.hasAccess,
      reason: accessResult.reason,
      ...(accessResult.tier && { tier: accessResult.tier }),
      ...(accessResult.expiresAt && { expiresAt: accessResult.expiresAt }),
      ...(accessResult.rateLimit && { rateLimit: accessResult.rateLimit }),
    };
    
    return NextResponse.json(validatedResult, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error checking access:', error);
    
    // Return a valid InnerCircleAccess object even on error
    const errorResult: InnerCircleAccess = {
      hasAccess: false,
      reason: 'no_request', // Valid reason from union type
    };
    
    return NextResponse.json(errorResult, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}

// Helper function to parse cookies
function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader
    .split(';')
    .reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.trim().split('=');
      const value = valueParts.join('='); // In case value contains '='
      if (key) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);
}