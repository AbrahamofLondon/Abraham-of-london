/**
 * pages/foundry/brief/success.tsx — RETIRED (Redirect)
 *
 * This page has been superseded by the Living Case checkout success page.
 * Redirects to /foundry/case/success.
 *
 * Returns 410 Gone to indicate the resource is permanently unavailable.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function BriefSuccessRedirect() {
  const router = useRouter()

  useEffect(() => {
    const { session_id, tier, caseId } = router.query
    const params = new URLSearchParams()
    if (session_id) params.set('session_id', session_id as string)
    if (tier) params.set('tier', tier as string)
    if (caseId) params.set('caseId', caseId as string)
    const queryString = params.toString()
    router.replace(`/foundry/case/success${queryString ? `?${queryString}` : ''}`)
  }, [router])

  return (
    <>
      <Head>
        <title>Redirecting — Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta httpEquiv="refresh" content="0;url=/foundry/case/success" />
      </Head>
      <div style={{ backgroundColor: 'rgb(3,3,5)', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-white/40 text-sm">Redirecting to the canonical success page...</p>
      </div>
    </>
  )
}