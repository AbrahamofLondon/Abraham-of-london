/**
 * Utility functions for sanitizing and processing MDX content
 */

import { JSDOM } from 'jsdom'

/**
 * Sanitizes HTML/MDX content by removing potentially unsafe elements and attributes
 */
export function sanitizeMdxContent(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  try {
    const dom = new JSDOM(content)
    const doc = dom.window.document
    
    // Remove unsafe elements
    const unsafeElements = doc.querySelectorAll('script, iframe, object, embed, form, input, button, select, textarea, style')
    unsafeElements.forEach(el => el.remove())
    
    // Remove unsafe attributes
    const allElements = doc.querySelectorAll('*')
    allElements.forEach(el => {
      const attrs = el.attributes
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i]
        if (isUnsafeAttribute(attr.name)) {
          el.removeAttribute(attr.name)
        }
      }
    })
    
    return doc.body.innerHTML
  } catch (error) {
    console.error('Error sanitizing MDX content:', error)
    // Fallback: basic HTML escaping
    return escapeHtml(content)
  }
}

/**
 * Checks if an attribute is unsafe
 */
function isUnsafeAttribute(attrName: string): boolean {
  const unsafePatterns = [
    /^on/i, // Event handlers (onclick, onload, etc.)
    /^javascript:/i,
    /^data:/i,
    /^vbscript:/i,
    /^mocha:/i,
    /^livescript:/i,
    /^fscommand:/i,
    /^seeksegmenttime:/i
  ]
  
  return unsafePatterns.some(pattern => pattern.test(attrName))
}

/**
 * Basic HTML escaping
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Extracts plain text from MDX content
 */
export function extractPlainTextFromMdx(content: string, maxLength: number = 200): string {
  if (!content || typeof content !== 'string') return ''
  
  try {
    // Remove MDX components and code blocks
    let plainText = content
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\{[^}]*\}/g, ' ') // Remove JSX expressions
      .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
      .replace(/`[^`]*`/g, ' ') // Remove inline code
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*\*|\*\*|\*/g, '') // Remove bold/italic markers
      .replace(/~~/g, '') // Remove strikethrough
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()
    
    // Truncate if needed
    if (maxLength > 0 && plainText.length > maxLength) {
      plainText = plainText.substring(0, maxLength).trim() + '...'
    }
    
    return plainText
  } catch (error) {
    console.error('Error extracting plain text from MDX:', error)
    return ''
  }
}

/**
 * Extracts headings from MDX content
 */
export interface Heading {
  level: number
  text: string
  id?: string
}

export function extractHeadingsFromMdx(content: string): Heading[] {
  if (!content || typeof content !== 'string') return []
  
  const headings: Heading[] = []
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    
    // Generate ID from text
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    headings.push({ level, text, id })
  }
  
  return headings
}

/**
 * Extracts image URLs from MDX content
 */
export function extractImagesFromMdx(content: string): string[] {
  if (!content || typeof content !== 'string') return []
  
  const images: string[] = []
  
  // Match markdown images: ![alt](src "title")
  const mdImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = mdImageRegex.exec(content)) !== null) {
    const url = match[1].split(' ')[0] // Get URL part before optional title
    if (url && !url.startsWith('http') && !url.startsWith('//')) {
      images.push(url)
    }
  }
  
  // Match HTML/JSX images: <img src="..." />
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  while ((match = htmlImageRegex.exec(content)) !== null) {
    const url = match[1]
    if (url && !url.startsWith('http') && !url.startsWith('//')) {
      images.push(url)
    }
  }
  
  return [...new Set(images)] // Remove duplicates
}

/**
 * Validates MDX content structure
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateMdxContent(content: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }
  
  if (!content || typeof content !== 'string') {
    result.isValid = false
    result.errors.push('Content is empty or not a string')
    return result
  }
  
  // Check for unclosed JSX tags
  const jsxTags = content.match(/<([A-Z][A-Za-z0-9]*)(?:\s+[^>]*)?>/g) || []
  const closingTags = content.match(/<\/([A-Z][A-Za-z0-9]*)>/g) || []
  
  const openedTags = jsxTags.map(tag => {
    const match = tag.match(/<([A-Z][A-Za-z0-9]*)/)
    return match ? match[1] : ''
  }).filter(Boolean)
  
  const closedTags = closingTags.map(tag => {
    const match = tag.match(/<\/([A-Z][A-Za-z0-9]*)>/)
    return match ? match[1] : ''
  }).filter(Boolean)
  
  openedTags.forEach(tag => {
    if (!closedTags.includes(tag)) {
      result.warnings.push(`Unclosed JSX tag: <${tag}>`)
    }
  })
  
  // Check for potential XSS
  const xssPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i,
    /<\s*script/i,
    /<\s*iframe/i
  ]
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      result.warnings.push('Potential XSS pattern detected')
    }
  })
  
  // Check for relative image paths that might be broken
  const relativeImages = extractImagesFromMdx(content)
  relativeImages.forEach(img => {
    if (img.startsWith('./') || img.startsWith('../')) {
      result.warnings.push(`Relative image path found: ${img}`)
    }
  })
  
  return result
}

/**
 * Generates excerpt from MDX content
 */
export function generateExcerpt(content: string, length: number = 160): string {
  if (!content || typeof content !== 'string') return ''
  
  const plainText = extractPlainTextFromMdx(content, 0) // Get full plain text
  
  if (plainText.length <= length) return plainText
  
  // Try to cut at sentence boundary
  const truncated = plainText.substring(0, length)
  const lastPeriod = truncated.lastIndexOf('. ')
  const lastQuestion = truncated.lastIndexOf('? ')
  const lastExclamation = truncated.lastIndexOf('! ')
  
  const cutIndex = Math.max(lastPeriod, lastQuestion, lastExclamation)
  
  if (cutIndex > length * 0.5) {
    return truncated.substring(0, cutIndex + 1) + '..'
  }
  
  return truncated.trim() + '...'
}

/**
 * Strips MDX/JSX components from content
 */
export function stripMdxComponents(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  return content
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>.*?<\/[A-Z][A-Za-z0-9]*>/gs, '') // Remove JSX components
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?\/>/g, '') // Remove self-closing JSX components
    .replace(/\{[^}]*\}/g, '') // Remove JSX expressions
    .replace(/import\s+.*?\s+from\s+['"][^'"]+['"]/g, '') // Remove import statements
    .replace(/export\s+(?:const|function|default)\s+[^;]+;/g, '') // Remove export statements
}

export default {
  sanitizeMdxContent,
  extractPlainTextFromMdx,
  extractHeadingsFromMdx,
  extractImagesFromMdx,
  validateMdxContent,
  generateExcerpt,
  stripMdxComponents
}