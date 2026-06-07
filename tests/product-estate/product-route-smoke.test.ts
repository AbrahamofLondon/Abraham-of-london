import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import audit from '@/lib/product/product-estate-reality-audit.json'

const root = process.cwd()

function candidateRoutes(route: string, mode: 'page' | 'api' = 'page') {
  const pathname = route.split('?')[0]?.replace(/\/$/, '') || '/'
  const parts = pathname.split('/').filter(Boolean)
  const file = parts.length === 0 ? 'index' : parts[parts.length - 1]
  const dir = parts.slice(0, -1).join('/')

  if (mode === 'api') {
    const apiPath = parts.join('/')
    return [
      `pages/${apiPath}.ts`,
      `pages/${apiPath}.tsx`,
      `pages/${apiPath}/index.ts`,
      `app/${apiPath}/route.ts`,
      `app/${apiPath}/route.tsx`,
    ]
  }

  const pagesBase = dir ? `pages/${dir}/${file}` : `pages/${file}`
  const appBase = parts.length === 0 ? 'app' : `app/${parts.join('/')}`
  return [
    `${pagesBase}.tsx`,
    `${pagesBase}.ts`,
    `${pagesBase}/index.tsx`,
    `${pagesBase}/index.ts`,
    `${appBase}/page.tsx`,
    `${appBase}/page.ts`,
  ]
}

function routeExists(route: string, mode: 'page' | 'api' = 'page') {
  if (route.includes('*')) return true
  if (route.includes('[') || route.includes(']')) return true
  return candidateRoutes(route, mode).some((candidate) => existsSync(join(root, candidate)))
}

describe('product estate static route smoke', () => {
  it('every primary public product route resolves in pages or app router', () => {
    for (const product of audit.products) {
      expect(routeExists(product.route), `${product.productCode}: ${product.route}`).toBe(true)
    }
  })

  it('known route correction points are explicit', () => {
    const pressure = audit.products.find((product) => product.productCode === 'decision_pressure_signal')
    expect(pressure?.route).toBe('/pressure')
    // /decision-pressure now redirects to /pressure — legacy route preserved as redirect
    expect(pressure?.alternateRoutes).toContain('/decision-pressure')
    expect(pressure?.classification).toBe('VERIFIED_ACTIVE')
  })

  it('admin command centre route exists', () => {
    expect(existsSync(join(root, 'app/admin/product-estate/page.tsx'))).toBe(true)
  })
})
