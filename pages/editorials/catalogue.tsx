// pages/editorials/catalogue.tsx
import { EDITORIAL_CATALOGUE } from '@/lib/editorial/catalogue'
import { discoverPublications } from './discovery'

export default function EditorialCataloguePage() {
  const publications = discoverPublications()
  
  const html = `
    <div>
      <h1>Editorial Catalogue</h1>
      <ul>
        ${publications.map(pub => `
          <li key="${pub.slug}">
            <a href="/editorials/${pub.slug}">${pub.title}</a>
          </li>
        `).join('')}
      </ul>
    </div>
  `
  
  return html
}