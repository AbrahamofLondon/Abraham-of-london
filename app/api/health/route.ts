// File: app/api/health/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function env(name: string, fallback = '') {
  const v = process.env[name];
  return typeof v === 'string' && v.length ? v : fallback;
}

export async function GET() {
  const body = {
    ok: true,
    service: 'abraham-of-london',
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      node_env: env('NODE_ENV', 'development'),
      next_telemetry_disabled: env('NEXT_TELEMETRY_DISABLED', '0'),
      site_url: env('NEXT_PUBLIC_SITE_URL'),
      netlify: {
        build_id: env('BUILD_ID'),
        commit_ref: env('COMMIT_REF'),
        context: env('CONTEXT'),
        branch: env('BRANCH'),
        deploy_url: env('DEPLOY_URL'),
        build_image: env('NETLIFY_BUILD_BASE_IMAGE'),
      },
    },
  };

  // Why: health responses must not cache
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
