// app/api/shorts/[slug]/interact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv'; // Or your preferred KV store

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const { action, userId } = await request.json();
    
    if (!['like', 'save'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Generate a session ID for anonymous users
    const sessionId = userId || `anon_${Date.now()}`;
    
    // Use KV store to track interactions
    const key = `short:${slug}:${action}`;
    const userKey = `short:${slug}:${action}:${sessionId}`;
    
    // Check if user already performed this action
    const hasInteracted = await kv.get(userKey);
    
    if (hasInteracted) {
      // Remove the interaction
      await kv.decr(key);
      await kv.del(userKey);
      return NextResponse.json({ 
        success: true, 
        action: 'removed',
        [action]: await kv.get(key) || 0
      });
    } else {
      // Add the interaction
      await kv.incr(key);
      await kv.setex(userKey, 86400 * 30, '1'); // Store for 30 days
      return NextResponse.json({ 
        success: true, 
        action: 'added',
        [action]: await kv.get(key) || 1
      });
    }
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
    const slug = params.slug;
    
    // Get counts for this short
    const likes = await kv.get(`short:${slug}:like`) || 0;
    const saves = await kv.get(`short:${slug}:save`) || 0;
    
    return NextResponse.json({
      likes: Number(likes),
      saves: Number(saves)
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { likes: 0, saves: 0 }
    );
  }
}