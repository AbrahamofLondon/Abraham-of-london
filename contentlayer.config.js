import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import path from 'path'

// ========== VALIDATION UTILITIES ==========
const validateField = (fieldName, value, expectedType) => {
  if (value === undefined || value === null) return false
  switch (expectedType) {
    case 'string':
      return typeof value === 'string' && value.trim() !== ''
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'date':
      return value instanceof Date || !isNaN(Date.parse(value))
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    default:
      return true
  }
}

const safeString = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str.trim()
}

const safeDate = (dateStr) => {
  try {
    if (!dateStr) return new Date()
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? new Date() : date
  } catch {
    return new Date()
  }
}

// ========== CONTENT PROCESSING ==========
const processRawContent = (rawContent, filePath) => {
  if (!rawContent || typeof rawContent !== 'string') return ''
  
  let content = rawContent
  const fileName = path.basename(filePath, path.extname(filePath))
  
  // Common YAML fixes
  const fixes = [
    // Remove trailing commas in arrays and objects
    [/,\s*\]/g, ']'],
    [/,\s*\}/g, '}'],
    // Fix empty list items
    [/-\s*$/gm, '- ""'],
    // Trim trailing whitespace
    [/\s+$/gm, ''],
    // Fix malformed YAML strings
    [/^([a-zA-Z0-9_]+):\s*'([^']*)'\s*$/gm, '$1: "$2"'],
    [/^([a-zA-Z0-9_]+):\s*"([^"]*)"\s*$/gm, '$1: "$2"'],
    // Fix multiline strings
    [/\|-\n\s*/g, '|-\n  '],
    // Fix escaped quotes
    [/\\"/g, '"'],
    // Remove extra dashes
    [/^---\s*$/gm, '---'],
    // Fix boolean values
    [/^([a-zA-Z0-9_]+):\s*(true|false|True|False)$/gm, '$1: $2'],
  ]
  
  fixes.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement)
  })
  
  // File-specific fixes
  const fileSpecificFixes = {
    'surrender-not-submission': [
      [/size:\s*['"]?1\.8\s*MB['"]?\s*$/gm, 'size: "1.8 MB"'],
    ],
    'surrender-operational-framework': [
      [/size:\s*['"]?0\.8\s*MB['"]?\s*$/gm, 'size: "0.8 MB"'],
      [/^----/gm, '---'],
    ],
    'legacy-architecture-canvas': [
      [/-\s*['"]?operating-cadence-pack['"]?\s*$/gm, '- "operating-cadence-pack"'],
      // Fix implicit keys
      [/(\d+\.)\s*\*\*\s*([^\n]+)/g, '$1 $2'],
    ],
  }
  
  if (fileSpecificFixes[fileName]) {
    fileSpecificFixes[fileName].forEach(([pattern, replacement]) => {
      content = content.replace(pattern, replacement)
    })
  }
  
  return content
}

// ========== CORE FIELDS WITH VALIDATION ==========
const CORE_FIELDS = {
  title: { 
    type: 'string', 
    required: true,
    validate: (value) => validateField('title', value, 'string'),
    defaultValue: 'Untitled'
  },
  date: { 
    type: 'date', 
    required: true,
    validate: (value) => validateField('date', value, 'date'),
    defaultValue: () => new Date().toISOString().split('T')[0]
  },
  description: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('description', value, 'string')
  },
  excerpt: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('excerpt', value, 'string')
  },
  draft: { 
    type: 'boolean', 
    required: false, 
    default: false,
    validate: (value) => !value || validateField('draft', value, 'boolean')
  },
  featured: { 
    type: 'boolean', 
    required: false, 
    default: false,
    validate: (value) => !value || validateField('featured', value, 'boolean')
  },
  tags: { 
    type: 'list', 
    of: { type: 'string' }, 
    required: false,
    validate: (value) => !value || validateField('tags', value, 'array'),
    defaultValue: []
  },
  author: { 
    type: 'string', 
    required: false, 
    default: 'Abraham of London',
    validate: (value) => !value || validateField('author', value, 'string')
  },
  slug: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('slug', value, 'string')
  },
  published: { 
    type: 'boolean', 
    required: false, 
    default: true,
    validate: (value) => !value || validateField('published', value, 'boolean')
  }
}

// ========== SHARED FIELDS ==========
const SHARED_FIELDS = {
  ogTitle: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('ogTitle', value, 'string')
  },
  ogDescription: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('ogDescription', value, 'string')
  },
  socialCaption: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('socialCaption', value, 'string')
  },
  readTime: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('readTime', value, 'string')
  },
  category: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('category', value, 'string')
  },
  coverImage: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('coverImage', value, 'string')
  },
  coverAspect: { 
    type: 'enum', 
    required: false, 
    default: 'book', 
    options: ['wide', 'book', 'square', 'portrait'],
    validate: (value) => !value || ['wide', 'book', 'square', 'portrait'].includes(value)
  },
  coverFit: { 
    type: 'enum', 
    required: false, 
    default: 'cover', 
    options: ['cover', 'contain', 'fill', 'none'],
    validate: (value) => !value || ['cover', 'contain', 'fill', 'none'].includes(value)
  },
  coverPosition: { 
    type: 'string', 
    required: false, 
    default: 'center',
    validate: (value) => !value || validateField('coverPosition', value, 'string')
  },
  authorTitle: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('authorTitle', value, 'string')
  },
  resources: { 
    type: 'json', 
    required: false,
    validate: (value) => !value || validateField('resources', value, 'object')
  },
  relatedDownloads: { 
    type: 'list', 
    of: { type: 'string' }, 
    required: false,
    validate: (value) => !value || validateField('relatedDownloads', value, 'array'),
    defaultValue: []
  },
  subtitle: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('subtitle', value, 'string')
  },
  layout: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('layout', value, 'string')
  },
  href: { 
    type: 'string', 
    required: false,
    validate: (value) => !value || validateField('href', value, 'string')
  }
}

// ========== COMPUTED FIELD RESOLVERS ==========
const getSlug = (doc) => {
  try {
    if (doc.slug && typeof doc.slug === 'string') return doc.slug
    if (doc._raw && doc._raw.flattenedPath) {
      return doc._raw.flattenedPath
        .replace(/^[^/]+\//, '')
        .replace(/\.(md|mdx)$/, '')
    }
    return 'untitled'
  } catch (error) {
    console.warn('Error computing slug:', error)
    return 'untitled'
  }
}

const getUrl = (prefix) => (doc) => {
  try {
    if (doc.href && typeof doc.href === 'string') return doc.href
    const slug = getSlug(doc)
    return `/${prefix}/${slug}`
  } catch (error) {
    console.warn(`Error computing URL for ${prefix}:`, error)
    return `/${prefix}/untitled`
  }
}

// ========== DOCUMENT TYPE FACTORY ==========
const createDocumentType = (name, filePathPattern, fields, computedFields = {}) => {
  return defineDocumentType(() => ({
    name,
    filePathPattern,
    contentType: 'mdx',
    fields: {
      ...CORE_FIELDS,
      ...SHARED_FIELDS,
      ...fields
    },
    computedFields: {
      url: {
        type: 'string',
        resolve: getUrl(name.toLowerCase())
      },
      slug: {
        type: 'string',
        resolve: getSlug
      },
      safeTitle: {
        type: 'string',
        resolve: (doc) => safeString(doc.title || 'Untitled')
      },
      safeDate: {
        type: 'date',
        resolve: (doc) => safeDate(doc.date)
      },
      ...computedFields
    }
  }))
}

// ========== DOCUMENT TYPE DEFINITIONS ==========
export const Post = createDocumentType('Post', 'blog/*.{md,mdx}', {
  series: { type: 'string', required: false },
  seriesOrder: { type: 'number', required: false },
  featuredImage: { type: 'string', required: false },
  readingTime: { type: 'string', required: false },
  density: { type: 'string', required: false },
  downloads: { type: 'json', required: false },
  isPartTwo: { type: 'boolean', required: false, default: false },
  previousPart: { type: 'string', required: false }
})

export const Book = createDocumentType('Book', 'books/*.{md,mdx}', {
  isbn: { type: 'string', required: false },
  accessLevel: { 
    type: 'enum', 
    required: false, 
    options: ['public', 'inner-circle', 'patron'],
    defaultValue: 'public'
  },
  lockMessage: { type: 'string', required: false }
})

export const Download = createDocumentType('Download', 'downloads/*.{md,mdx}', {
  fileUrl: { type: 'string', required: false },
  downloadUrl: { type: 'string', required: false },
  downloadFile: { type: 'string', required: false },
  pdfPath: { type: 'string', required: false },
  file: { type: 'string', required: false },
  fileSize: { type: 'string', required: false },
  fileType: { 
    type: 'enum', 
    required: false, 
    options: ['pdf', 'docx', 'xlsx', 'zip', 'image', 'other'],
    defaultValue: 'pdf'
  },
  version: { 
    type: 'string', 
    required: false, 
    default: '1.0'
  },
  accessLevel: { 
    type: 'enum', 
    required: false, 
    default: 'public', 
    options: ['public', 'registered', 'inner-circle']
  },
  fileFormat: { type: 'string', required: false },
  format: { type: 'string', required: false },
  useLegacyDiagram: { type: 'boolean', required: false, default: false },
  useProTip: { type: 'boolean', required: false, default: false },
  useFeatureGrid: { type: 'boolean', required: false, default: false },
  useDownloadCTA: { type: 'boolean', required: false, default: false },
  ctaConfig: { type: 'json', required: false },
  ctaPrimary: { type: 'json', required: false },
  ctaSecondary: { type: 'json', required: false },
  related: { 
    type: 'list', 
    of: { type: 'string' }, 
    required: false,
    defaultValue: []
  },
  canonicalUrl: { type: 'string', required: false },
  updated: { type: 'date', required: false },
  language: { 
    type: 'string', 
    required: false, 
    default: 'en-GB'
  },
  readingTime: { type: 'string', required: false },
  proTipType: { type: 'string', required: false },
  proTipContent: { type: 'string', required: false },
  featureGridColumns: { 
    type: 'number', 
    required: false,
    defaultValue: 3
  },
  featureGridItems: { type: 'json', required: false },
  downloadProcess: { type: 'json', required: false },
  tier: { type: 'string', required: false }
}, {
  hasFile: {
    type: 'boolean',
    resolve: (doc) => !!(doc.fileUrl || doc.downloadUrl || doc.pdfPath || doc.file)
  }
})

export const Canon = createDocumentType('Canon', 'canon/*.{md,mdx}', {
  volumeNumber: { type: 'string', required: false },
  order: { type: 'number', required: false },
  lockMessage: { type: 'string', required: false },
  accessLevel: { 
    type: 'enum', 
    required: false, 
    default: 'inner-circle', 
    options: ['public', 'inner-circle', 'patron']
  }
})

export const Short = createDocumentType('Short', 'shorts/*.{md,mdx}', {
  audience: { type: 'string', required: false },
  theme: { 
    type: 'enum', 
    required: false, 
    options: ['gentle', 'hard-truths', 'hopeful', 'urgent', 'instructional', 'reflective']
  }
})

export const Print = createDocumentType('Print', 'prints/*.{md,mdx}', {
  printType: { 
    type: 'enum', 
    required: false, 
    options: ['card', 'playbook', 'kit', 'brief', 'pack', 'template', 'worksheet']
  },
  dimensions: { type: 'string', required: false },
  orientation: { 
    type: 'enum', 
    required: false, 
    default: 'portrait', 
    options: ['portrait', 'landscape']
  }
})

export const Resource = createDocumentType('Resource', 'resources/*.{md,mdx}', {
  resourceType: { 
    type: 'enum', 
    required: false, 
    options: ['kit', 'worksheet', 'checklist', 'blueprint', 'scorecard', 'framework', 'charter', 'agenda', 'plan', 'template', 'guide']
  },
  downloadUrl: { type: 'string', required: false },
  version: { 
    type: 'string', 
    required: false, 
    default: '1.0'
  },
  lastUpdated: { type: 'date', required: false },
  readtime: { type: 'string', required: false },
  fileUrl: { type: 'string', required: false }
}, {
  isUpdated: {
    type: 'boolean',
    resolve: (doc) => {
      if (!doc.lastUpdated || !doc.date) return false
      try {
        const lastUpdated = new Date(doc.lastUpdated)
        const created = new Date(doc.date)
        return lastUpdated > created
      } catch {
        return false
      }
    }
  }
})

export const Event = createDocumentType('Event', 'events/*.{md,mdx}', {
  eventDate: { type: 'date', required: false },
  endDate: { type: 'date', required: false },
  time: { type: 'string', required: false },
  location: { type: 'string', required: false },
  virtualLink: { type: 'string', required: false },
  registrationUrl: { type: 'string', required: false },
  registrationRequired: { 
    type: 'boolean', 
    required: false, 
    default: false 
  },
  capacity: { type: 'number', required: false },
  accessLevel: { 
    type: 'enum', 
    required: false, 
    default: 'public', 
    options: ['public', 'private', 'invite-only']
  }
}, {
  isUpcoming: {
    type: 'boolean',
    resolve: (doc) => {
      if (!doc.eventDate) return false
      try {
        const eventDate = new Date(doc.eventDate)
        return eventDate > new Date()
      } catch {
        return false
      }
    }
  },
  isPast: {
    type: 'boolean',
    resolve: (doc) => {
      if (!doc.eventDate) return false
      try {
        const eventDate = new Date(doc.eventDate)
        return eventDate <= new Date()
      } catch {
        return false
      }
    }
  }
})

// ========== FALLBACK DOCUMENT TYPE ==========
export const Unknown = defineDocumentType(() => ({
  name: 'Unknown',
  filePathPattern: '**/*.{md,mdx}',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true, default: 'Untitled' },
    date: { type: 'date', required: true, default: () => new Date() },
    content: { type: 'string', required: true, default: '' }
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => {
        try {
          return doc._raw.sourceFilePath.replace(/\.(md|mdx)$/, '')
        } catch {
          return '/unknown'
        }
      }
    }
  }
}))

// ========== MAIN CONFIG ==========
export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Book, Download, Canon, Short, Print, Resource, Event],
  contentDirExclude: [
    '**/node_modules/**',
    '**/.git/**',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/.*' // Hidden files
  ],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'wrap',
        properties: {
          className: ['heading-anchor'],
          'aria-hidden': 'true'
        }
      }]
    ]
  },
  processRawContent,
  onExtraFieldData: (fieldData) => {
    // Log but ignore extra fields
    if (fieldData && Object.keys(fieldData).length > 0) {
      console.warn(`Extra fields found in document: ${Object.keys(fieldData).join(', ')}`)
    }
    return {}
  },
  onSuccess: async (data) => {
    try {
      const count = data?.allDocuments?.length || 0
      console.log(`✅ Contentlayer successfully processed ${count} documents`)
      
      // Log document type breakdown
      const typeCounts = {}
      if (data?.allDocuments) {
        data.allDocuments.forEach(doc => {
          typeCounts[doc._type] = (typeCounts[doc._type] || 0) + 1
        })
        console.log('📊 Document type breakdown:', typeCounts)
      }
      
      return data
    } catch (error) {
      console.error('❌ Error in Contentlayer success handler:', error)
      return data || { allDocuments: [] }
    }
  },
  onError: (error) => {
    console.error('❌ Contentlayer error:', error)
    // Return empty data to prevent build failure
    return { allDocuments: [] }
  }
})