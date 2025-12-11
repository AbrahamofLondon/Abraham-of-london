// app/api/shorts/[slug]/interact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { handleInteraction, getInteractionCount } from "@/lib/short-interactions";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const slug = params.slug;
    const { action } = await request.json();
    
    if (!['like', 'save'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const result = await handleInteraction(slug, action, session?.user?.id);
    const counts = await getInteractionCount(slug);

    return NextResponse.json({
      success: true,
      ...result,
      ...counts,
      isAuthenticated: !!session?.user,
    });
  } catch (error) {
    console.error('Interaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process interaction' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const slug = params.slug;
    
    const counts = await getInteractionCount(slug);

    return NextResponse.json({
      ...counts,
      isAuthenticated: !!session?.user,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { likes: 0, saves: 0, isAuthenticated: false }
    );
  }
}