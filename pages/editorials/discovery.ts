// pages/editorials/discovery.ts
import { EDITORIAL_CATALOGUE } from '@/lib/editorial/catalogue'

export function discoverPublications() {
  return EDITORIAL_CATALOGUE.map(entry => ({
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    cover: entry.cover,
  }))
}

export function getPublicationBySlug(slug: string) {
  return EDITORIAL_CATALOGUE.find(entry => entry.slug === slug)
}