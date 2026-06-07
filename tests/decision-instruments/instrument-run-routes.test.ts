import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const resultsRoute = readFileSync(
  join(process.cwd(), 'pages/api/decision-instruments/results/index.ts'),
  'utf-8',
)

const pdfRoute = readFileSync(
  join(process.cwd(), 'pages/api/downloads/instrument-pdf.ts'),
  'utf-8',
)

const decisionExposureRun = readFileSync(
  join(process.cwd(), 'pages/decision-instruments/decision-exposure-instrument/run.tsx'),
  'utf-8',
)

const dynamicInstrumentPage = readFileSync(
  join(process.cwd(), 'pages/decision-instruments/[slug].tsx'),
  'utf-8',
)

describe('decision instrument run route authority wiring', () => {
  it('starts a DecisionInstrumentRun before saving compatibility output', () => {
    expect(resultsRoute).toContain('startInstrumentRun')
    expect(resultsRoute).toContain('entitlementSlugForInstrument')
    expect(resultsRoute).toContain('completeInstrumentRun')
  })

  it('does not use Date.now as a result identity fallback', () => {
    expect(resultsRoute).not.toContain('Date.now()')
    expect(resultsRoute).toContain('instrument_${slug}_${run.id}')
  })

  it('fails closed when entitlement or run persistence is denied', () => {
    expect(resultsRoute).toContain('InstrumentEntitlementError')
    expect(resultsRoute).toContain('INSTRUMENT_ENTITLEMENT_REQUIRED')
    expect(resultsRoute).toContain('InstrumentRunPersistenceError')
    expect(resultsRoute).toContain('INSTRUMENT_RUN_NOT_PERSISTED')
  })
})

describe('decision instrument PDF route authority wiring', () => {
  it('requires runId and verifies run ownership before redirect', () => {
    expect(pdfRoute).toContain('runId required')
    expect(pdfRoute).toContain('decisionInstrumentRun.findFirst')
    expect(pdfRoute).toContain('RUN_OWNERSHIP_REQUIRED')
    expect(pdfRoute).toContain('resolveCanonicalEntitlement')
  })

  it('records artifact generation state and hash', () => {
    expect(pdfRoute).toContain('beginArtifactGeneration')
    expect(pdfRoute).toContain('recordArtifact')
    expect(pdfRoute).toContain('artifactHash')
    expect(pdfRoute).toContain('failArtifactGeneration')
  })
})

describe('decision instrument UI download links', () => {
  it('uses runId-bound PDF hrefs after result persistence', () => {
    expect(decisionExposureRun).toContain('data.runId')
    expect(decisionExposureRun).toContain('runId=${encodeURIComponent(resultKey)}')
  })

  it('does not expose slug-only worksheet PDFs on the dynamic detail page', () => {
    expect(dynamicInstrumentPage).not.toContain('/api/downloads/instrument-pdf?slug=')
    expect(dynamicInstrumentPage).toContain('PDF dossier unlocks after saved run')
  })
})
