# File: app/api/health/route.ts
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

  return NextResponse.json(body, {
    headers: {
      // Why: health responses must not cache
      'Cache-Control': 'no-store',
    },
  });
}


# File: app/(site)/cache-test/page.tsx
import Image from 'next/image';

export const dynamic = 'force-static';

export default function CacheTestPage() {
  return (
    <main style={{ padding: 24, lineHeight: 1.6 }}>
      <h1>Cache & Headers Test</h1>
      <p>
        Use browser devtools → Network to verify caching:
      </p>
      <ul>
        <li>
          <code>/_next/static/*</code> should be <code>Cache-Control: public, max-age=31536000, immutable</code>
        </li>
        <li>
          <code>/assets/*</code> should be <code>public, max-age=604800</code>
        </li>
        <li>
          <code>/downloads/*.pdf</code> should be <code>public, max-age=31536000, immutable</code>
        </li>
        <li>
          <code>/downloads/fathering-without-fear.pdf</code> should be <code>no-store</code>
        </li>
        <li>
          <code>/api/health</code> should be <code>no-store</code>
        </li>
      </ul>

      <h2>Sample assets</h2>
      <ul>
        <li><a href="/assets/sample.txt" target="_blank" rel="noreferrer">/assets/sample.txt</a></li>
        <li><a href="/downloads/Fathering_Without_Fear.pdf" target="_blank" rel="noreferrer">/downloads/Fathering_Without_Fear.pdf</a></li>
        <li><a href="/downloads/fathering-without-fear.pdf" target="_blank" rel="noreferrer">/downloads/fathering-without-fear.pdf</a> (should be <code>no-store</code>)</li>
      </ul>

      <h2>Inline Next image</h2>
      <div style={{ width: 240, height: 160, position: 'relative' }}>
        <Image src="/assets/images/downloads/example.jpg" alt="example" fill sizes="240px" />
      </div>

      <h2>Health</h2>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, overflowX: 'auto' }}>
        <code>curl -i {`"${typeof window !== 'undefined' ? window.location.origin : ''}/api/health"`}</code>
      </pre>
    </main>
  );
}


# File: public/410.html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>410 Gone</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html,body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0b0c0c; color:#fff; }
    main { max-width: 720px; margin: 12vh auto; padding: 24px; }
    h1 { font-size: 2rem; margin: 0 0 0.5rem; }
    p { opacity: 0.9; }
    a { color: #8ecae6; }
  </style>
</head>
<body>
  <main>
    <h1>410 — This site has moved</h1>
    <p>The brand now lives on our main domain.</p>
    <p><a href="https://www.abrahamoflondon.org/ventures">Go to abrahamoflondon.org → Ventures</a></p>
  </main>
</body>
</html>


# File: public/assets/sample.txt
This is a sample asset for verifying Cache-Control headers.


# File: netlify.toml (only the new/changed parts to append/replace in your existing file)

# ── Brand domains: keep root 301 → Ventures, everything else → 410

# Endureluxe: root path 301 to Ventures
[[redirects]]
  from = "/"
  to   = "https://www.abrahamoflondon.org/ventures?brand=endureluxe"
  status = 301
  conditions = { Host = ["endureluxe.com", "www.endureluxe.com"] }

# Endureluxe: any other path → 410 (serve static 410 page)
[[redirects]]
  from = "/*"
  to   = "/410.html"
  status = 410
  force = true
  conditions = { Host = ["endureluxe.com", "www.endureluxe.com"] }

# Alomarada: root path 301 to Ventures
[[redirects]]
  from = "/"
  to   = "https://www.abrahamoflondon.org/ventures?brand=alomarada"
  status = 301
  conditions = { Host = ["alomarada.com", "www.alomarada.com"] }

# Alomarada: any other path → 410
[[redirects]]
  from = "/*"
  to   = "/410.html"
  status = 410
  force = true
  conditions = { Host = ["alomarada.com", "www.alomarada.com"] }
