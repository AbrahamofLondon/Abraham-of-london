/**
 * tests/product/products-page-surfacing.test.ts
 * Enforces /products page surfacing rules.
 */
import { describe, it, expect } from 'vitest'
import {
  getProductsForDirectory,
  getProductsByFamily,
  PRODUCT_ESTATE,
} from '@/lib/product/product-estate-contract'

describe('products page surfacing', () => {
  const directoryItems = getProductsForDirectory()

  it('boardroom_brief appears on products page', () => {
    expect(directoryItems.map(p => p.id)).toContain('boardroom_brief')
  })

  it('boardroom_brief has route /boardroom-brief', () => {
    const item = directoryItems.find(p => p.id === 'boardroom_brief')
    expect(item?.route).toBe('/boardroom-brief')
  })

  it('gmi_q1_2026 (Global Market Intelligence) appears on products page', () => {
    expect(directoryItems.map(p => p.id)).toContain('gmi_q1_2026')
  })

  it('decision_pressure_signal appears on products page', () => {
    expect(directoryItems.map(p => p.id)).toContain('decision_pressure_signal')
  })

  it('all live governed instruments appear on products page', () => {
    const instruments = getProductsByFamily('governed_instruments')
    for (const item of instruments.filter(p => p.live && p.governed)) {
      expect(
        item.shouldAppearOnProducts,
        `${item.name}: live governed instrument should appear on products`,
      ).toBe(true)
    }
  })

  it('no live governed product is invisible on both products and pricing', () => {
    const hidden = PRODUCT_ESTATE.filter(
      p => p.live && p.governed && !p.shouldAppearOnProducts && !p.shouldAppearOnPricing,
    )
    expect(hidden.map(p => p.name), 'Hidden live governed products:').toEqual([])
  })

  it('retainer_oversight appears on products page as gated and not live', () => {
    const item = directoryItems.find(p => p.id === 'retainer_oversight')
    expect(item).toBeDefined()
    expect(item!.live).toBe(false)
    expect(item!.availability).toBe('retainer_gated')
  })

  it('purpose_alignment is in separate family from operational corridor', () => {
    const corridorIds = getProductsByFamily('operational_decision_corridor').map(p => p.id)
    expect(corridorIds).not.toContain('personal_decision_audit')
  })

  it('no product uses AI-tool framing in name or description', () => {
    const prohibited = ['ai tool', 'ai assistant', 'chatbot', 'ai predicts', 'machine learning model']
    for (const item of PRODUCT_ESTATE) {
      const text = `${item.name} ${item.shortDescription} ${item.buyerDescription}`.toLowerCase()
      for (const term of prohibited) {
        expect(text, `${item.name}: contains '${term}'`).not.toContain(term)
      }
    }
  })

  it('no admin route appears in products directory items', () => {
    for (const item of directoryItems) {
      if (item.route) {
        expect(item.route).not.toContain('/admin')
        expect(item.route).not.toContain('/api/')
      }
    }
  })

  it('retainer_review_queue appears on products page as active', () => {
    const item = directoryItems.find(p => p.id === 'retainer_review_queue')
    expect(item).toBeDefined()
    expect(item!.live).toBe(true)
    expect(item!.availability).toBe('operator_review')
  })

  it('all governed playbooks appear on products page', () => {
    const playbookIds = ['execution_integrity_protocol', 'alignment_audit_playbook', 'drift_detection_framework']
    for (const id of playbookIds) {
      const item = directoryItems.find(p => p.id === id)
      expect(item, `Playbook '${id}' missing from products page`).toBeDefined()
      expect(item!.live, `Playbook '${id}' not marked live`).toBe(true)
      expect(item!.governed, `Playbook '${id}' not marked governed`).toBe(true)
    }
  })

  it('no live governed instrument is marked Planned', () => {
    const instruments = getProductsByFamily('governed_instruments')
    for (const item of instruments.filter(p => p.live && p.governed)) {
      expect(item.availability, `${item.name}: live governed instrument marked as planned`).not.toBe('planned')
    }
  })

  it('GMI copy does not use prediction or AI certainty language', () => {
    const gmiItems = getProductsByFamily('market_intelligence')
    const prohibited = ['ai predicts', 'prediction engine', 'forecast certainty', 'market oracle', 'guaranteed market']
    for (const item of gmiItems) {
      const text = `${item.name} ${item.shortDescription} ${item.buyerDescription}`.toLowerCase()
      for (const term of prohibited) {
        expect(text, `GMI '${item.name}' contains prohibited term '${term}'`).not.toContain(term)
      }
    }
  })

  it('Boardroom Brief remains visible as first paid proof product', () => {
    const item = directoryItems.find(p => p.id === 'boardroom_brief')
    expect(item).toBeDefined()
    expect(item!.shouldAppearOnProducts).toBe(true)
    expect(item!.availability).toBe('paid')
  })

  it('Retainer Oversight remains gated', () => {
    const item = directoryItems.find(p => p.id === 'retainer_oversight')
    expect(item).toBeDefined()
    expect(item!.live).toBe(false)
    expect(item!.availability).toBe('retainer_gated')
  })
})
