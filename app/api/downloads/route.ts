// app/api/downloads/route.ts
import { getDownloads } from '@/lib/downloads'; // Correct import
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const downloads = getDownloads();
    return NextResponse.json(downloads);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json([], { status: 500 });
  }
}