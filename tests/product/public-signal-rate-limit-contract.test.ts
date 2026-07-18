import type { NextApiRequest } from 'next'
import { describe, expect, it } from 'vitest'
import { rateLimit } from '@/lib/server/rateLimit'

function key(id: string) {
  return `public-kernel-signal-test:${id}:${Date.now()}:${Math.random()}`
}

function req(headers: Record<string, string>, remoteAddress?: string): NextApiRequest {
  return {
    headers,
    socket: { remoteAddress },
  } as NextApiRequest
}

function publicSignalIdentity(request: NextApiRequest): string {
  const socketIp = (request.socket as { remoteAddress?: string } | undefined)?.remoteAddress?.trim()
  if (socketIp) return socketIp
  const xf = request.headers['x-forwarded-for']
  return (Array.isArray(xf) ? xf[0] : xf)?.split(',')[0]?.trim() || '0.0.0.0'
}

describe('public signal rate-limit contract', () => {
  it('allows requests below and at threshold, then rejects above threshold', () => {
    const limiterKey = key('threshold')
    const config = { limit: 3, windowSeconds: 60 }

    expect(rateLimit(limiterKey, config).ok).toBe(true)
    expect(rateLimit(limiterKey, config).ok).toBe(true)
    expect(rateLimit(limiterKey, config).ok).toBe(true)
    expect(rateLimit(limiterKey, config)).toMatchObject({ ok: false, remaining: 0, limit: 3 })
  })

  it('isolates separate identities in the process-local store', () => {
    const config = { limit: 1, windowSeconds: 60 }

    expect(rateLimit(key('user-a'), config).ok).toBe(true)
    expect(rateLimit(key('user-b'), config).ok).toBe(true)
  })

  it('does not let spoofed forwarded headers rotate identity when socket identity exists', () => {
    const first = publicSignalIdentity(req({ 'x-forwarded-for': '203.0.113.10' }, '198.51.100.7'))
    const second = publicSignalIdentity(req({ 'x-forwarded-for': '203.0.113.99' }, '198.51.100.7'))

    expect(first).toBe('198.51.100.7')
    expect(second).toBe(first)
  })

  it('defines anonymous fallback identity when no transport identity is present', () => {
    expect(publicSignalIdentity(req({}))).toBe('0.0.0.0')
  })

  it('does not require or store raw situation text in limiter keys', () => {
    const rawSituation = 'This raw situation text must never be part of the limiter key.'
    const limiterKey = `public-kernel-signal:${publicSignalIdentity(req({}, '198.51.100.8'))}`

    expect(limiterKey).toBe('public-kernel-signal:198.51.100.8')
    expect(limiterKey).not.toContain(rawSituation)
  })
})