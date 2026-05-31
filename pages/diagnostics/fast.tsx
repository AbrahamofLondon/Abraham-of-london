/**
 * pages/diagnostics/fast.tsx — Legacy Fast Diagnostic (Redirect)
 *
 * This page has been superseded by the kernel-backed Foundry decision test.
 * The next.config.mjs redirect handles the server-side redirect.
 * This page exists as a client-side fallback for any direct access.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function FastDiagnosticRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/foundry/decision-test')
  }, [router])

  return (
    <>
      <Head>
        <title>Redirecting — Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta httpEquiv="refresh" content="0;url=/foundry/decision-test" />
      </Head>
      <div style={{ backgroundColor: 'rgb(3,3,5)', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-white/40 text-sm">
          Redirecting to the kernel-backed decision test...
        </p>
      </div>
    </>
  )
}