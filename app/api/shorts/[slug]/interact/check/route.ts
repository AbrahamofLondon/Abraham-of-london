// app/api/shorts/[slug]/interact/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }
    
    const userKey = `short:${slug}:${action}:${userId}`;
    const hasInteracted = await kv.get(userKey);
    
    return NextResponse.json({
      hasInteracted: !!hasInteracted
    });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { hasInteracted: false }
    );
  }
}