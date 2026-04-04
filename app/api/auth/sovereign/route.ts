// app/api/auth/sovereign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { key, returnTo } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }
    
    const validKey = process.env.SOVEREIGN_ACCESS_KEY || "SOVEREIGN-ALIGN-2026";
    const isValid = key.toUpperCase() === validKey.toUpperCase();
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
    }
    
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    const response = NextResponse.json({ 
      authenticated: true, 
      returnTo: returnTo || '/dashboard' 
    });
    
    response.cookies.set('sovereign_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('[Sovereign Auth]', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get('sovereign_session');
  if (session) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
