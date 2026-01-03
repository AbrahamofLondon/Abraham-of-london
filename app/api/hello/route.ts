// app/api/hello/route.ts - App Router version
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const dynamicData = {
    timestamp: new Date().toISOString(),
    server: process.env.NODE_ENV,
    method: request.method,
    message: 'Hello from the server!',
    random: Math.random()
  };

  return NextResponse.json(dynamicData, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}

// Optional: Add POST method if needed
export async function POST(request: Request) {
  const dynamicData = {
    timestamp: new Date().toISOString(),
    server: process.env.NODE_ENV,
    method: request.method,
    message: 'Hello from POST!',
    random: Math.random()
  };

  return NextResponse.json(dynamicData, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}