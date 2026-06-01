import { describe, it, expect } from 'vitest'
import {
  ENGINE_ACTIVATION_REGISTRY,
  getEnginesForSurface,
  getGatedEngines,
  getInternalEngines,
  getEngineById,
  getEnginesForLayer,
  assertNoAvailableStatus,
  validateRegistry,
} from '@/lib/intelligence/engine-activation-registry'

describe('Engine Activation Registry', () => {
  // -------------------------------------------------------------------------
  // 1. No engine has status AVAILABLE
  // -------------------------------------------------------------------------
  it('no engine has status AVAILABLE', () => {
    for (const engine of ENGINE_ACTIVATION_REGISTRY) {
      expect(engine.status).not.toBe('AVAILABLE')
    }
    expect(() => assertNoAvailableStatus()).not.toThrow()
  })

  // -------------------------------------------------------------------------
  // 2. Every ACTIVE engine has activeSurfaces
  // -------------------------------------------------------------------------
  it('every ACTIVE engine has at least one activeSurface', () => {
    const active = ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'ACTIVE')
    expect(active.length).toBeGreaterThan(0)
    for (const engine of active) {
      expect(
        engine.activeSurfaces.length,
        `${engine.engineId} has no activeSurfaces`,
      ).toBeGreaterThan(0)
    }
  })

  // -------------------------------------------------------------------------
  // 3. Every GATED engine has gatedReason
  // -------------------------------------------------------------------------
  it('every GATED engine has a gatedReason', () => {
    const gated = ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'GATED')
    expect(gated.length).toBeGreaterThan(0)
    for (const engine of gated) {
      expect(
        engine.gatedReason,
        `${engine.engineId} is GATED but has no gatedReason`,
      ).toBeTruthy()
    }
  })

  // -------------------------------------------------------------------------
  // 4. Every engine has requiredInputs
  // -------------------------------------------------------------------------
  it('every engine has at least one requiredInput', () => {
    for (const engine of ENGINE_ACTIVATION_REGISTRY) {
      expect(
        engine.requiredInputs.length,
        `${engine.engineId} has no requiredInputs`,
      ).toBeGreaterThan(0)
    }
  })

  // -------------------------------------------------------------------------
  // 5. getEnginesForSurface('purpose_alignment') returns purpose-relevant engines
  // -------------------------------------------------------------------------
  it('getEnginesForSurface("purpose_alignment") returns purpose-relevant engines', () => {
    const engines = getEnginesForSurface('purpose_alignment')
    const ids = engines.map(e => e.engineId)

    expect(ids).toContain('situation-translator')
    expect(ids).toContain('decision-class-taxonomy')
    expect(ids).toContain('kernel-lens-runner')

    // Should span multiple layers
    const layers = new Set(engines.map(e => e.layer))
    expect(layers.has('SITUATION_UNDERSTANDING')).toBe(true)
    expect(layers.has('LENS_ANALYSIS')).toBe(true)
    expect(layers.has('SYNTHESIS')).toBe(true)

    // Should not include GATED or INTERNAL engines
    for (const engine of engines) {
      expect(engine.status).not.toBe('GATED')
      expect(engine.status).not.toBe('INTERNAL')
    }
  })

  // -------------------------------------------------------------------------
  // 6. getEnginesForSurface('constitutional_diagnostic') returns constitutional-relevant engines
  // -------------------------------------------------------------------------
  it('getEnginesForSurface("constitutional_diagnostic") returns constitutional-relevant engines', () => {
    const engines = getEnginesForSurface('constitutional_diagnostic')
    const ids = engines.map(e => e.engineId)

    expect(ids).toContain('constitutional-engine')
    expect(ids).toContain('assessment-engine')
    // domain-interdependency is now GATED (requires contradictionGraph) — not in ACTIVE results
    expect(ids).not.toContain('domain-interdependency')

    // Should not include GATED or INTERNAL engines
    for (const engine of engines) {
      expect(engine.status).not.toBe('GATED')
      expect(engine.status).not.toBe('INTERNAL')
    }
  })

  // -------------------------------------------------------------------------
  // 7. Drift/tribunal engines are GATED
  // -------------------------------------------------------------------------
  it('drift-rules and drift-tribunal are GATED with case memory reason', () => {
    const driftRules = getEngineById('drift-rules')
    expect(driftRules).toBeDefined()
    expect(driftRules!.status).toBe('GATED')
    expect(driftRules!.gatedReason).toMatch(/case memory/i)

    const driftTribunal = getEngineById('drift-tribunal')
    expect(driftTribunal).toBeDefined()
    expect(driftTribunal!.status).toBe('GATED')
    expect(driftTribunal!.gatedReason).toMatch(/case memory/i)
  })

  // -------------------------------------------------------------------------
  // 8. SignalContinuity is ACTIVE (ungated after journey wiring)
  // -------------------------------------------------------------------------
  it('signal-continuity is ACTIVE after journey wiring', () => {
    const engine = getEngineById('signal-continuity')
    expect(engine).toBeDefined()
    expect(engine!.status).toBe('ACTIVE')
    expect(engine!.activeSurfaces.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // 9. GovernedMemoryPresenter is ACTIVE
  // -------------------------------------------------------------------------
  it('governed-memory-presenter is ACTIVE for decision_centre', () => {
    const engine = getEngineById('governed-memory-presenter')
    expect(engine).toBeDefined()
    expect(engine!.status).toBe('ACTIVE')
    expect(engine!.activeSurfaces).toContain('decision_centre')
    expect(engine!.activeSurfaces).toContain('strategy_room')
  })

  // -------------------------------------------------------------------------
  // 10. validateRegistry returns no errors
  // -------------------------------------------------------------------------
  it('validateRegistry returns no errors', () => {
    const errors = validateRegistry()
    expect(errors).toEqual([])
  })

  // -------------------------------------------------------------------------
  // Bonus tests
  // -------------------------------------------------------------------------

  it('every INTERNAL engine has explanatory outputContract', () => {
    const internal = getInternalEngines()
    expect(internal.length).toBeGreaterThan(0)
    for (const engine of internal) {
      expect(
        engine.outputContract,
        `${engine.engineId} has no outputContract`,
      ).toBeTruthy()
      expect(
        engine.outputContract.includes(' — ') || engine.outputContract.includes(' - '),
        `${engine.engineId} outputContract should contain a dash separator with a description`,
      ).toBe(true)
    }
  })

  it('registry contains all expected layers', () => {
    const layers = new Set(ENGINE_ACTIVATION_REGISTRY.map(e => e.layer))
    const expectedLayers = [
      'SITUATION_UNDERSTANDING',
      'LENS_ANALYSIS',
      'CONTRADICTION',
      'CONSTITUTIONAL',
      'SIMULATION',
      'SYNTHESIS',
      'EVIDENCE_MEMORY',
      'OUTPUT',
      'OVERSIGHT',
    ]
    for (const layer of expectedLayers) {
      expect(layers.has(layer as any), `missing layer: ${layer}`).toBe(true)
    }
  })

  it('ACTIVE engine count is reasonable', () => {
    const active = ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'ACTIVE')
    expect(active.length).toBeGreaterThanOrEqual(30)
  })

  it('getGatedEngines returns expected count', () => {
    const gated = getGatedEngines()
    expect(gated.length).toBeGreaterThanOrEqual(8)
  })

  // -------------------------------------------------------------------------
  // Engine Reality — ACTIVE means actually invoked
  // -------------------------------------------------------------------------
  it('contradiction-forcing is GATED (not invoked in any production path)', () => {
    const engine = getEngineById('contradiction-forcing')
    expect(engine).toBeDefined()
    expect(engine!.status).toBe('GATED')
    expect(engine!.gatedReason).toBeTruthy()
    expect(engine!.activeSurfaces).toEqual([])
  })

  it('scenario-stress-test is ACTIVE for enterprise assessment when valid scenario responses are supplied', () => {
    const engine = getEngineById('scenario-stress-test')
    expect(engine).toBeDefined()
    expect(engine!.status).toBe('ACTIVE')
    expect(engine!.activeSurfaces).toEqual(['enterprise_assessment'])
    expect(engine!.userVisibleDestination).toMatch(/Enterprise scenario stress/i)
  })

  it('no engine status contains the word AVAILABLE', () => {
    for (const engine of ENGINE_ACTIVATION_REGISTRY) {
      expect(engine.status).not.toBe('AVAILABLE')
      if (engine.gatedReason) {
        expect(engine.gatedReason.toLowerCase()).not.toContain('available')
      }
    }
  })

  it('every ACTIVE engine has a known invocation path', () => {
    const activeEngines = ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'ACTIVE')
    for (const engine of activeEngines) {
      // Every ACTIVE engine must have either userVisibleDestination or outputContract
      const hasOutput = engine.userVisibleDestination || engine.outputContract
      expect(hasOutput).toBeTruthy()
      // And must have at least one active surface
      expect(engine.activeSurfaces.length).toBeGreaterThan(0)
    }
  })
})
