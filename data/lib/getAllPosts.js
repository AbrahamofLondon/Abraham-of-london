import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'data', 'blog')
const META_DIR = path.join(process.cwd(), 'data', 'meta')

export function getAllPosts() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

  return files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, '')
    const metaPath = path.join(META_DIR, `${slug}.json`)
    const contentPath = path.join(BLOG_DIR, filename)

    const source = fs.readFileSync(contentPath, 'utf8')
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))

    return {
      slug,
      meta,
      content: source,
    }
  })
}
