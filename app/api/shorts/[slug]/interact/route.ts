// app/api/shorts/[slug]/interact/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for demo purposes
// In production, use a database like Supabase, Firebase, or Vercel KV
const interactionStore = new Map<string, { likes: Set<string>; saves: Set<string> }>();

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

    // Initialize store for this slug if not exists
    if (!interactionStore.has(slug)) {
      interactionStore.set(slug, {
        likes: new Set(),
        saves: new Set(),
      });
    }

    const store = interactionStore.get(slug)!;
    const userSet = action === 'like' ? store.likes : store.saves;
    
    let currentAction = 'removed';
    
    if (userSet.has(userId)) {
      // Remove interaction
      userSet.delete(userId);
    } else {
      // Add interaction
      userSet.add(userId);
      currentAction = 'added';
    }

    return NextResponse.json({ 
      success: true, 
      action: currentAction,
      [action]: userSet.size
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
    const slug = params.slug;
    
    const store = interactionStore.get(slug) || {
      likes: new Set(),
      saves: new Set(),
    };
    
    return NextResponse.json({
      likes: store.likes.size,
      saves: store.saves.size
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { likes: 0, saves: 0 }
    );
  }
}