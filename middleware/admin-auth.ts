// middleware/admin-auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user is accessing admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the token from cookies or headers
    const token = request.cookies.get('admin_token')?.value;
    
    // For demo - implement your actual auth logic here
    const isAuthenticated = token === 'your-secure-admin-token';
    
    if (!isAuthenticated) {
      // Redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};