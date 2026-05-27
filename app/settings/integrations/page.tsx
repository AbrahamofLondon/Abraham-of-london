/**
 * app/settings/integrations/page.tsx
 *
 * Server-component wrapper for the integrations settings page.
 *
 * WHY this is a server component (not 'use client'):
 *   A pure 'use client' page.tsx without a server-component wrapper gets added to
 *   prerender-manifest.json by Next.js. @vercel/next then expects a Lambda for that
 *   route but the file is prerendered as static HTML → "Unable to find lambda for
 *   route: /settings/integrations".
 *
 *   The correct pattern (used by /portal, /client, /restricted, etc.):
 *     1. page.tsx = server component with force-dynamic (→ ƒ Dynamic Lambda)
 *     2. IntegrationsClient.tsx = 'use client' component with all interactive logic
 *
 *   force-dynamic ensures this route is classified as ƒ (Dynamic), giving @vercel/next
 *   a Lambda to package. The Lambda is lightweight — it just streams the client shell.
 */

import { Suspense } from "react";
import IntegrationsClient from "./IntegrationsClient";

export const dynamic = "force-dynamic";

export default function IntegrationsSettingsPage() {
  return (
    <Suspense fallback={<main />}>
      <IntegrationsClient />
    </Suspense>
  );
}
