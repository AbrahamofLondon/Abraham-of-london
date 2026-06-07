import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import audit from '@/lib/product/product-estate-reality-audit.json'
import { PRODUCT_ESTATE } from '@/lib/product/product-estate-contract'

function sourceForRoute(route: string) {
  const pathname = route.split('?')[0]?.replace(/\/$/, '') || '/'
  const parts = pathname.split('/').filter(Boolean)
  const file = parts.length === 0 ? 'index' : parts[parts.length - 1]
  const dir = parts.slice(0, -1).join('/')
  const pagesBase = dir ? `pages/${dir}/${file}` : `pages/${file}`
  const appBase = parts.length === 0 ? 'app' : `app/${parts.join('/')}`
  return [
    `${pagesBase}.tsx`,
    `${pagesBase}.ts`,
    `${pagesBase}/index.tsx`,
    `${pagesBase}/index.ts`,
    `${appBase}/page.tsx`,
    `${appBase}/page.ts`,
  ].find((candidate) => existsSync(join(process.cwd(), candidate)))
}

describe('CTA coherence', () => {
  it('every live product estate item has one primary CTA when it appears publicly', () => {
    for (const item of PRODUCT_ESTATE) {
      if (!item.live || (!item.shouldAppearOnProducts && !item.shouldAppearOnPricing)) continue

      expect(item.primaryCTA, `${item.id}: missing primary CTA`).toBeTruthy()
      expect(item.route, `${item.id}: missing route`).toBeTruthy()
      expect(item.route?.startsWith('/'), `${item.id}: route must be internal absolute path`).toBe(true)
    }
  })

  it('core public product pages do not route primary CTAs to admin or API surfaces', () => {
    for (const product of audit.products) {
      expect(product.route.startsWith('/admin'), `${product.productCode}: primary route points to admin`).toBe(false)
      expect(product.route.startsWith('/api'), `${product.productCode}: primary route points to API`).toBe(false)
    }
  })

  it('key product source files contain their declared commercial next step or CTA route context', () => {
    for (const product of audit.products.filter((item) => item.active)) {
      const source = sourceForRoute(product.route)
      expect(source, `${product.productCode}: source file missing`).toBeTruthy()
      const text = readFileSync(join(process.cwd(), source!), 'utf-8')
      const routeNeedle = product.route.split('/').filter(Boolean).pop()
      const nameNeedle = product.productName.split('/')[0]?.trim()

      expect(
        text.includes(routeNeedle ?? product.productCode) || text.includes(nameNeedle ?? product.productCode),
        `${product.productCode}: source lacks obvious product/route context`,
      ).toBe(true)
    }
  })
})
