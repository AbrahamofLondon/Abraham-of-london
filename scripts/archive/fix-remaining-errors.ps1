# fix-remaining-errors.ps1
# Targeted fixes for remaining TypeScript errors

Write-Host "=== Fixing Remaining TypeScript Errors ===" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. First, fix the types/post.ts issues
Write-Host "`n[1/10] Fixing Post type definitions..." -ForegroundColor Yellow

$postTypesContent = @'
// types/post.ts - Updated Post types with proper inheritance

export interface ImageType {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  published: boolean;
  featured: boolean;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  subtitle?: string;
  description?: string;
  coverImage?: string | ImageType | null;
  ogImage?: string | ImageType | null;
  series?: string;
  seriesOrder?: number;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  authors?: string[];
  wordCount?: number;
  canonicalUrl?: string;
  noindex?: boolean;
  lastModified?: string;
}

export interface Post extends PostMeta {
  content: string;
  html?: string;
  compiledSource?: string;
}

export interface PostWithContent extends Post {
  html: string;
  compiledSource: string;
}

export interface PostForClient extends Omit<PostMeta, 'published' | 'featured' | 'category' | 'author' | 'readTime'> {
  published?: boolean;
  featured?: boolean;
  category?: string;
  author?: string;
  readTime?: string;
  id?: string;
  content?: string;
  html?: string;
  coverImage?: string | ImageType | null;
  ogImage?: string | ImageType | null;
  description?: string;
}

export interface PostSummary extends Omit<PostMeta, 'category' | 'readTime' | 'author'> {
  category?: string;
  readTime?: string;
  author?: string;
  id?: string;
}

export interface PostList {
  posts: PostSummary[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PostNavigation {
  prev?: PostSummary | null;
  next?: PostSummary | null;
}

export interface FrontmatterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  required?: string[];
  types?: Record<string, string>;
}
'@

Set-Content -Path "types/post.ts" -Value $postTypesContent
Write-Host "  ✓ Fixed Post type inheritance issues" -ForegroundColor Green

# 2. Remove the duplicate export statements (they're already exported)
Write-Host "`n[2/10] Fixing export conflicts..." -ForegroundColor Yellow

# Remove the problematic duplicate exports
$postTypesContent = Get-Content "types/post.ts" -Raw
$postTypesContent = $postTypesContent -replace "// Export types for posts-utils compatibility[\s\S]*", ""
Set-Content -Path "types/post.ts" -Value $postTypesContent
Write-Host "  ✓ Removed duplicate exports" -ForegroundColor Green

# 3. Fix image-utils.ts to accept proper types
Write-Host "`n[3/10] Fixing image utilities..." -ForegroundColor Yellow

$imageUtilsContent = @'
// utils/image-utils.ts
import type { ImageType } from '@/types/post';

/**
 * Normalize image to string URL
 */
export function normalizeImage(image?: string | ImageType | null): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.src || null;
}

/**
 * Normalize image to string URL or undefined
 */
export function normalizeImageToUndefined(image?: string | ImageType | null): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.src;
}

/**
 * Extract string from ImageType object
 */
export function imageToString(image?: string | ImageType | null): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.src;
}
'@

Set-Content -Path "utils/image-utils.ts" -Value $imageUtilsContent
Write-Host "  ✓ Fixed image utilities type signatures" -ForegroundColor Green

# 4. Fix posts-utils.ts
Write-Host "`n[4/10] Fixing posts-utils.ts..." -ForegroundColor Yellow

$postsUtilsPath = "lib/posts-utils.ts"
$content = Get-Content $postsUtilsPath -Raw

# Fix imports
$content = $content -replace "import type \{([^}]+)\} from '@/types/post'", @"
import type {
  PostForClient,
  PostSummary,
  PostList,
  ImageType,
  PostNavigation,
  FrontmatterValidation
} from '@/types/post';
"@

# Fix toPostWithContent function
$content = $content -replace "export function toPostWithContent\(post: Post\): PostWithContent \{", @"
export function toPostWithContent(post: Post & { html?: string; compiledSource?: string }): PostWithContent {
"@

# Add default values for required fields
$content = $content -replace "html: post\.html,", @"
    html: post.html || '',
"@

$content = $content -replace "compiledSource: post\.compiledSource,", @"
    compiledSource: post.compiledSource || '',
"@

# Fix toPostForClient function
$content = $content -replace "export function toPostForClient\(post: Post\): PostForClient \{", @"
export function toPostForClient(post: Post): PostForClient {
"@

# Add default values
$content = $content -replace "published: post\.published,", @"
    published: post.published ?? true,
"@

$content = $content -replace "featured: post\.featured,", @"
    featured: post.featured ?? false,
"@

$content = $content -replace "category: post\.category,", @"
    category: post.category || '',
"@

$content = $content -replace "author: post\.author,", @"
    author: post.author || '',
"@

$content = $content -replace "readTime: post\.readTime,", @"
    readTime: post.readTime || '',
"@

# Fix toPostSummary function
$content = $content -replace "export function toPostSummary\(postMeta: Post \| PostMeta\): PostSummary \{", @"
export function toPostSummary(postMeta: Post | PostMeta): PostSummary {
"@

# Add default values
$content = $content -replace "category: postMeta\.category,", @"
    category: postMeta.category || '',
"@

$content = $content -replace "readTime: postMeta\.readTime,", @"
    readTime: postMeta.readTime || '',
"@

$content = $content -replace "author: postMeta\.author,", @"
    author: postMeta.author || '',
"@

# Fix PostNavigation property name (previous -> prev)
$content = $content -replace "previous:", "prev:"

# Fix createPost function
$content = $content -replace "excerpt: data\.excerpt,", @"
    excerpt: data.excerpt || '',
"@

$content = $content -replace "category: data\.category,", @"
    category: data.category || '',
"@

$content = $content -replace "author: data\.author,", @"
    author: data.author || '',
"@

$content = $content -replace "readTime: data\.readTime,", @"
    readTime: data.readTime || '',
"@

# Fix FrontmatterValidation schema access
$content = $content -replace "schema\.required\.forEach", "(schema.required || []).forEach"
$content = $content -replace "schema\.types", "(schema.types || {})"

Set-Content -Path $postsUtilsPath -Value $content
Write-Host "  ✓ Fixed posts-utils.ts type issues" -ForegroundColor Green

# 5. Fix types/post-utils.ts
Write-Host "`n[5/10] Fixing types/post-utils.ts..." -ForegroundColor Yellow

$postUtilsPath = "types/post-utils.ts"
if (Test-Path $postUtilsPath) {
    $content = Get-Content $postUtilsPath -Raw
    
    # Fix imports
    $content = $content -replace "import type \{([^}]+)\} from '@/types/post'", @"
import type {
  PostForClient,
  PostSummary,
  PostList,
  ImageType,
  PostNavigation,
  FrontmatterValidation
} from '@/types/post';
"@
    
    # Fix function signatures
    $content = $content -replace "export function toPostWithContent\(post: Post\): PostWithContent \{", @"
export function toPostWithContent(post: Post & { html?: string; compiledSource?: string }): PostWithContent {
"@
    
    $content = $content -replace "export function toPostForClient\(post: Post\): PostForClient \{", @"
export function toPostForClient(post: Post): PostForClient {
"@
    
    $content = $content -replace "export function toPostSummary\(postMeta: Post \| PostMeta\): PostSummary \{", @"
export function toPostSummary(postMeta: Post | PostMeta): PostSummary {
"@
    
    # Fix PostNavigation property
    $content = $content -replace "previous:", "prev:"
    
    # Remove compiledSource from toPostForClient
    $content = $content -replace "    compiledSource: post\.compiledSource\s*", ""
    
    # Add default values
    $content = $content -replace "html: post\.html,", "    html: post.html || '',"
    $content = $content -replace "compiledSource: post\.compiledSource", "    compiledSource: post.compiledSource || ''"
    $content = $content -replace "excerpt: postMeta\.excerpt \|\| undefined,", "    excerpt: postMeta.excerpt || '',"
    $content = $content -replace "category: postMeta\.category,", "    category: postMeta.category || '',"
    $content = $content -replace "readTime: postMeta\.readTime,", "    readTime: postMeta.readTime || '',"
    $content = $content -replace "author: postMeta\.author,", "    author: postMeta.author || '',"
    $content = $content -replace "excerpt: data\.excerpt,", "    excerpt: data.excerpt || '',"
    $content = $content -replace "category: data\.category,", "    category: data.category || '',"
    $content = $content -replace "author: data\.author,", "    author: data.author || '',"
    $content = $content -replace "readTime: data\.readTime,", "    readTime: data.readTime || '',"
    
    Set-Content -Path $postUtilsPath -Value $content
    Write-Host "  ✓ Fixed types/post-utils.ts" -ForegroundColor Green
}

# 6. Fix lib/content.ts exports
Write-Host "`n[6/10] Fixing lib/content.ts..." -ForegroundColor Yellow

$contentPath = "lib/content.ts"
if (Test-Path $contentPath) {
    # Check if the functions exist in the file
    $content = Get-Content $contentPath -Raw
    
    # Import the missing functions from posts-utils
    if ($content -notmatch "import.*getPostSummaries") {
        # Add imports at the top
        $imports = @"
import {
  getPostSummaries,
  getSortedPosts,
  getPaginatedPosts,
  getRecentPosts,
  searchPosts,
  getPostsByCategory,
  getPostsByTag,
  createPost,
  postsAPI
} from './posts-utils';
"@
        $content = $content -replace "import.*from '\./posts-utils'", $imports
    }
    
    Set-Content -Path $contentPath -Value $content
    Write-Host "  ✓ Fixed lib/content.ts imports" -ForegroundColor Green
}

# 7. Fix API endpoints
Write-Host "`n[7/10] Fixing API endpoints..." -ForegroundColor Yellow

# Fix export.ts - make handler async
$exportPath = "pages/api/admin/inner-circle/export.ts"
if (Test-Path $exportPath) {
    $content = Get-Content $exportPath -Raw
    $content = $content -replace "export default function handler\(", "export default async function handler("
    Set-Content -Path $exportPath -Value $content
    Write-Host "  ✓ Fixed export.ts async handler" -ForegroundColor Green
}

# Fix unlock.ts - make handleGet async
$unlockPath = "pages/api/inner-circle/unlock.ts"
if (Test-Path $unlockPath) {
    $content = Get-Content $unlockPath -Raw
    $content = $content -replace "function handleGet\(", "async function handleGet("
    Set-Content -Path $unlockPath -Value $content
    Write-Host "  ✓ Fixed unlock.ts async handler" -ForegroundColor Green
}

# 8. Fix pages/index.tsx duplicate imports
Write-Host "`n[8/10] Fixing duplicate imports..." -ForegroundColor Yellow

$indexPath = "pages/index.tsx"
if (Test-Path $indexPath) {
    $content = Get-Content $indexPath -Raw
    
    # Remove duplicate imports - keep only one
    # First, extract all imports
    $lines = Get-Content $indexPath
    $uniqueImports = @{}
    $newLines = @()
    
    foreach ($line in $lines) {
        if ($line -match "import.*imageToString.*from.*utils/image-utils") {
            if (-not $uniqueImports.ContainsKey("imageToString")) {
                $uniqueImports["imageToString"] = $true
                $newLines += $line
            }
            # Skip duplicate
        } else {
            $newLines += $line
        }
    }
    
    Set-Content -Path $indexPath -Value ($newLines -join "`n")
    Write-Host "  ✓ Removed duplicate imports from index.tsx" -ForegroundColor Green
}

# 9. Fix pages/books/index.tsx
Write-Host "`n[9/10] Fixing books page..." -ForegroundColor Yellow

$booksIndexPath = "pages/books/index.tsx"
if (Test-Path $booksIndexPath) {
    $content = Get-Content $booksIndexPath -Raw
    
    # Fix author property access
    $content = $content -replace "author: typeof post\.author === 'string' \? post\.author : post\.author\?\.name,", @"
        author: typeof post.author === 'string' ? post.author : (post as any).author?.name || '',
"@
    
    # Fix _id property
    $content = $content -replace "_id: post\._id \|\| post\.slug,", @"
        _id: (post as any)._id || post.slug,
"@
    
    # Fix status property
    $content = $content -replace "status: post\.status as 'published' \| 'draft' \| 'scheduled' \| undefined,", @"
        status: (post as any).status as 'published' | 'draft' | 'scheduled' | undefined,
"@
    
    # Fix draft property
    $content = $content -replace "if \(post\.draft === true\) return false;", @"
        if ((post as any).draft === true) return false;
"@
    
    Set-Content -Path $booksIndexPath -Value $content
    Write-Host "  ✓ Fixed books page type assertions" -ForegroundColor Green
}

# 10. Fix utils/content-utils.ts
Write-Host "`n[10/10] Fixing content-utils.ts..." -ForegroundColor Yellow

$contentUtilsPath = "utils/content-utils.ts"
if (Test-Path $contentUtilsPath) {
    $content = Get-Content $contentUtilsPath -Raw
    
    # Add default values for required fields
    $content = $content -replace "date: doc\.date,", @"
    date: doc.date || '',
"@
    
    $content = $content -replace "author: doc\.author,", @"
    author: doc.author || '',
"@
    
    $content = $content -replace "category: doc\.category,", @"
    category: doc.category || '',
"@
    
    $content = $content -replace "readTime: typeof doc\.readTime === 'number' \? String\(doc\.readTime\) : doc\.readTime,", @"
    readTime: (typeof doc.readTime === 'number' ? String(doc.readTime) : doc.readTime) || '',
"@
    
    Set-Content -Path $contentUtilsPath -Value $content
    Write-Host "  ✓ Fixed content-utils.ts default values" -ForegroundColor Green
}

# 11. Fix resources.ts
Write-Host "`n[11/11] Fixing resources.ts..." -ForegroundColor Yellow

$resourcesPath = "lib/resources.ts"
if (Test-Path $resourcesPath) {
    $content = Get-Content $resourcesPath -Raw
    
    # Update the map function to properly handle coverImage
    $content = $content -replace "return resources\.map\(resource => \{", @"
return resources.map(resource => {
  // Ensure coverImage is string or undefined
  let coverImage: string | undefined;
  if (resource.coverImage) {
    if (typeof resource.coverImage === 'string') {
      coverImage = resource.coverImage;
    } else if (typeof resource.coverImage === 'object' && resource.coverImage !== null) {
      coverImage = (resource.coverImage as any).src;
    }
  }
"@
    
    # Update the return object
    $content = $content -replace "coverImage: resource\.coverImage,", "    coverImage,"
    
    Set-Content -Path $resourcesPath -Value $content
    Write-Host "  ✓ Fixed resources.ts coverImage handling" -ForegroundColor Green
}

# 12. Fix lib/verify-types.ts
Write-Host "`n[12/12] Fixing verify-types.ts..." -ForegroundColor Yellow

$verifyTypesPath = "lib/verify-types.ts"
if (Test-Path $verifyTypesPath) {
    $content = Get-Content $verifyTypesPath -Raw
    
    # Update the test post with required fields
    $content = $content -replace "const testPost: Post = \{", @"
const testPost: Post = {
  slug: 'test',
  title: 'Test Post',
  date: '2024-01-01',
  excerpt: 'Test excerpt',
  content: 'Test content',
  published: true,
  featured: false,
  category: 'test',
  tags: ['test'],
  author: 'Test Author',
  readTime: '5 min',
"@
    
    Set-Content -Path $verifyTypesPath -Value $content
    Write-Host "  ✓ Fixed verify-types.ts test data" -ForegroundColor Green
}

# Run final type check
Write-Host "`n=== Running final type check ===" -ForegroundColor Cyan
pnpm run typecheck:safe 2>&1 | Out-File -FilePath "typecheck-final.log"

# Check error count
$errorCount = (Select-String -Path "typecheck-final.log" -Pattern "error TS[0-9]" | Measure-Object).Count

if ($errorCount -eq 0) {
    Write-Host "`n🎉 All TypeScript errors fixed!" -ForegroundColor Green
    Write-Host "You can now run the build:" -ForegroundColor Cyan
    Write-Host "  pnpm run build:windows" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Still $errorCount errors remaining." -ForegroundColor Yellow
    Write-Host "Check typecheck-final.log for details" -ForegroundColor Gray
}

Write-Host "`n=== Summary of Changes ===" -ForegroundColor Cyan
Write-Host "1. Fixed Post type inheritance with Omit<>" -ForegroundColor Gray
Write-Host "2. Added default values for optional fields" -ForegroundColor Gray
Write-Host "3. Fixed image utility type signatures" -ForegroundColor Gray
Write-Host "4. Fixed async handlers in API endpoints" -ForegroundColor Gray
Write-Host "5. Removed duplicate imports" -ForegroundColor Gray
Write-Host "6. Added type assertions where needed" -ForegroundColor Gray

Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Review the changes made" -ForegroundColor White
Write-Host "2. Run: pnpm run typecheck:safe" -ForegroundColor White
Write-Host "3. If clean, run: pnpm run build:windows" -ForegroundColor White