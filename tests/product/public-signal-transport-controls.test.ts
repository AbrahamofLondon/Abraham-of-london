import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  kernelProcess: vi.fn(),
  runDecisionIntelligence: vi.fn(),
  persistPublicSignal: vi.fn(),
  composeCaseDerivedJudgement: vi.fn(),
  rateLimit: vi.fn(),
  getClientIp: vi.fn(),
}))

vi.mock('@/lib/server/rateLimit', () => ({
  createRateLimitHeaders: (result: { limit: number; remaining: number; resetSeconds: number }) => ({
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(result.resetSeconds),
  }),
  getClientIp: mocks.getClientIp,
  isRateLimited: (result: { ok: boolean }) => !result.ok,
  rateLimit: mocks.rateLimit,
}))

vi.mock('@/lib/intelligence/decision-intelligence-kernel', () => ({
  DecisionIntelligenceKernel: vi.fn(function DecisionIntelligenceKernel(this: { process: unknown }) {
    this.process = mocks.kernelProcess
  }),
}))

vi.mock('@/lib/kernel/adversarial-preview', () => ({
  selectAdversarialPreview: vi.fn(() => null),
}))

vi.mock('@/lib/product/user-language-extraction', () => ({
  extractSafeUserLanguageQuotes: vi.fn(() => ['safe quote']),
}))

vi.mock('@/lib/intelligence/decision-intelligence-orchestrator', () => ({
  runDecisionIntelligence: mocks.runDecisionIntelligence,
}))

vi.mock('@/lib/product/public-signal-persistence', () => ({
  persistPublicSignalFromDecisionIntelligence: mocks.persistPublicSignal,
}))

vi.mock('@/lib/judgement/compose-case-derived-judgement', () => ({
  composeCaseDerivedJudgement: mocks.composeCaseDerivedJudgement,
}))

import handler, { config } from '@/pages/api/public/kernel-signal'

interface MockRes {
  _status: number
  _body: unknown
  _headers: Record<string, string | string[]>
  status(code: number): MockRes
  json(body: unknown): MockRes
  setHeader(name: string, value: string | string[]): MockRes
}

function makeReq(body: unknown, overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'POST',
    body,
    headers: {},
    socket: { remoteAddress: '198.51.100.10' },
    ...overrides,
  } as NextApiRequest
}

function makeRes(): NextApiResponse & MockRes {
  const res: MockRes = {
    _status: 200,
    _body: null,
    _headers: {},
    status(code: number) {
      res._status = code
      return res
    },
    json(body: unknown) {
      res._body = body
      return res
    },
    setHeader(name: string, value: string | string[]) {
      res._headers[name] = value
      return res
    },
  }

  return res as unknown as NextApiResponse & MockRes
}

function okRateLimit() {
  return { ok: true, allowed: true, remaining: 19, resetSeconds: 60, limit: 20 }
}

function successKernelResult() {
  return {
    status: 'COMPLETED',
    output: {
      sections: [
        { id: 'situation_class', content: 'execution risk' },
        { id: 'what_the_system_saw', content: 'A decision is blocked.' },
        { id: 'primary_failure_point', content: 'owner ambiguity' },
        { id: 'governing_tension', content: 'speed versus authority' },
        { id: 'consequence_class', content: 'delay cost' },
        { id: 'what_full_analysis_maps', content: ['authority', 'evidence'] },
        { id: 'direction_of_minimum_viable_move', content: 'name the owner' },
      ],
    },
    livingCase: {
      regulatedBoundary: { hit: false },
      review: { state: 'not_required' },
    },
    classification: { alternativeClasses: [] },
    translation: { surfacedDimensions: ['authority'], preservedAmbiguities: [] },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getClientIp.mockReturnValue('198.51.100.10')
  mocks.rateLimit.mockReturnValue(okRateLimit())
  mocks.kernelProcess.mockResolvedValue(successKernelResult())
  mocks.runDecisionIntelligence.mockResolvedValue({
    status: 'PUBLIC_SAFE_SIGNAL',
    accumulatedDepth: 1,
    publicSafe: true,
  })
  mocks.persistPublicSignal.mockResolvedValue({ persisted: true, durable: true })
  mocks.composeCaseDerivedJudgement.mockReturnValue({ status: 'insufficient_pattern_evidence' })
})

describe('public kernel signal transport controls', () => {
  it('declares a real body-parser size limit instead of relying on Content-Length', () => {
    expect(config.api.bodyParser.sizeLimit).toBe('8kb')
  })

  it('sets no-store private on success responses', async () => {
    const res = makeRes()
    await handler(makeReq({ situation: 'We cannot decide who owns the launch.' }), res)

    expect(res._status).toBe(200)
    expect(res._headers['Cache-Control']).toBe('no-store, private')
    expect(res._body).toMatchObject({ clarificationRequired: false })
  })

  it('sets no-store private when clarification is required', async () => {
    mocks.kernelProcess.mockResolvedValueOnce({
      status: 'CLARIFICATION_REQUIRED',
      translation: { decisionClass: 'unclear authority', kernelInterpretation: 'More facts required.', surfacedDimensions: [], preservedAmbiguities: [] },
      questions: [{ domain: 'authority', question: 'Who can make the decision?' }],
    })
    const res = makeRes()

    await handler(makeReq({ situation: 'This is blocked but I do not know why.' }), res)

    expect(res._status).toBe(200)
    expect(res._headers['Cache-Control']).toBe('no-store, private')
    expect(res._body).toMatchObject({ clarificationRequired: true })
  })

  it('sets no-store private on validation errors and does not process input', async () => {
    const res = makeRes()
    await handler(makeReq({ situation: '   ' }), res)

    expect(res._status).toBe(400)
    expect(res._headers['Cache-Control']).toBe('no-store, private')
    expect(mocks.kernelProcess).not.toHaveBeenCalled()
  })

  it('sets no-store private on rate-limited responses and does not process input', async () => {
    mocks.rateLimit.mockReturnValueOnce({ ok: false, allowed: false, remaining: 0, resetSeconds: 60, limit: 20 })
    const res = makeRes()

    await handler(makeReq({ situation: 'A valid situation that should be throttled.' }), res)

    expect(res._status).toBe(429)
    expect(res._headers['Cache-Control']).toBe('no-store, private')
    expect(mocks.kernelProcess).not.toHaveBeenCalled()
  })

  it('sets no-store private on oversized parsed bodies and does not process input', async () => {
    const res = makeRes()
    await handler(makeReq({ situation: 'x'.repeat(6001) }), res)

    expect(res._status).toBe(413)
    expect(res._headers['Cache-Control']).toBe('no-store, private')
    expect(mocks.kernelProcess).not.toHaveBeenCalled()
  })

  it('sets no-store private on internal errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.kernelProcess.mockRejectedValueOnce(new Error('boom'))
    const res = makeRes()

    await handler(makeReq({ situation: 'This should trigger an internal failure.' }), res)

    expect(res._status).toBe(500)
    expect(res._headers['Cache-Control']).toBe('no-store, private')
    expect(res._body).toMatchObject({ error: 'An internal error occurred while processing your situation.' })
    consoleError.mockRestore()
  })

  it('rate-limit keys use transport identity only and never include raw situation text', async () => {
    const situation = 'This raw situation must not enter the limiter key.'
    const res = makeRes()

    await handler(makeReq({ situation }), res)

    expect(mocks.rateLimit).toHaveBeenCalledWith('public-kernel-signal:198.51.100.10', { limit: 20, windowSeconds: 60 })
    expect(JSON.stringify(mocks.rateLimit.mock.calls)).not.toContain(situation)
  })
})