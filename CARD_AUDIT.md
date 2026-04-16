# Card System Audit
## Goal: Unify card architecture around CardShell

### Current Card Landscape (Priority Components)

#### 1. **BlogPostCard** (`components/BlogPostCard.tsx`)
- **Purpose**: Featured blog posts with rich imagery
- **Structure**: 
  - Image section with overlay/badges
  - Title + excerpt
  - Author metadata with avatar
  - Tags section
  - Luxury hover effects
- **Size variants**: compact, default, featured, luxury
- **Dependencies**: Image utilities, contentlayer helpers
- **Status**: Recently updated to design system colors

#### 2. **BlogCard** (`components/blog/BlogCard.tsx`)
- **Purpose**: Simple blog listing cards
- **Structure**:
  - Title
  - Date metadata
  - Excerpt
  - Tags
  - Simple CTA
- **Status**: Recently updated to design system colors

#### 3. **BaseCard** (`components/Cards/BaseCard.tsx`)
- **Purpose**: Generic card for briefs/documents
- **Structure**:
  - Cover image with tactical badges
  - Category metadata header
  - Title + subtitle
  - Abstract/description
  - Archive footer with date
- **Status**: Recently improved contrast

#### 4. **ContentCard** (`components/ContentCard.tsx`)
- **Purpose**: Categorized content cards with icon
- **Structure**:
  - Icon with dynamic color
  - Category badge
  - Title
  - Description
  - CTA with arrow
- **Special**: Dynamic color system

#### 5. **BookCard** (`components/BookCard.tsx`)
- **Purpose**: Book preview cards
- **Structure**:
  - Cover image (portrait)
  - Title + subtitle
  - Status badge
  - Blurb/description
  - Progress bar (for writing progress)
  - CTA link
- **Status**: Recently updated to design system colors

#### 6. **CardShell** (`components/primitives/CardShell.tsx`)
- **Purpose**: Foundational card wrapper
- **Structure**:
  - Surface contract integration
  - Density variants (airy, balanced, compact)
  - Interactive states
  - Semantic styling via design system
- **Status**: Ready for adoption

### Shared Structure Analysis

#### Common Elements Across Cards:
1. **Shell/Container** - All have rounded borders, background, hover states
2. **Image/Cover** - Most have image sections with various aspect ratios
3. **Metadata** - Dates, categories, tags, status badges
4. **Title + Body** - Heading + description/excerpt
5. **CTA/Interaction** - Links, buttons, hover effects

#### Styling Drift Issues:
1. **Spacing**: Inconsistent padding (p-4, p-5, p-6, p-8)
2. **Title Scale**: Varying font sizes and weights
3. **Metadata Rhythm**: Different text sizes/opacities for metadata
4. **Hover Treatment**: Some scale, some translate, some shadow changes
5. **Border/Panel**: Different border widths and opacities

### Consolidation Strategy

#### Phase 1: Create Shared Primitives
1. **CardShell** - Already exists, needs enhancement
2. **SmartCover** - Unified image component with:
   - Aspect ratio variants
   - Fallback sequences
   - Badge positioning
   - Overlay gradients
3. **ContentMeta** - Unified metadata component with:
   - Date formatting
   - Category/tag rendering
   - Author display
   - Reading time

#### Phase 2: Migrate Priority Components
1. **BlogCard** → CardShell variant (simplest)
2. **BaseCard** → CardShell variant
3. **ContentCard** → CardShell variant with icon slot
4. **BookCard** → CardShell variant with progress slot
5. **BlogPostCard** → CardShell variant (most complex)

#### Phase 3: Deprecate Duplicates
- `components/Cards/BlogPostCard.tsx` (duplicate)
- `components/books/BookCard.tsx` (duplicate)
- `components/canon/CanonCard.tsx` (check usage)
- `components/Cards/BookCard.tsx` (duplicate)

### Implementation Plan

#### 1. Enhance CardShell
- Add image slot with configurable aspect ratio
- Add metadata slot
- Add title/body slots
- Add footer/CTA slot
- Add badge/status slot

#### 2. Create SmartCover Component
- Handle all image loading/fallback logic
- Support aspect ratios: square, portrait, landscape, wide
- Support badges: featured, new, locked, status
- Support overlays: gradient, scrim

#### 3. Create ContentMeta Component
- Date formatting utilities
- Category/tag rendering
- Author display with avatar
- Reading time display

#### 4. Pilot Migration Order
1. BlogCard (simplest)
2. BaseCard 
3. ContentCard
4. BookCard
5. BlogPostCard (most complex)

### Rules Enforcement
- No giant universal Frankenstein card
- No duplicate visual logic across wrappers  
- No hardcoded colors - semantic tokens only
- No commit until pilot surfaces are visually consistent

### Next Steps
1. Audit actual usage of each card component
2. Enhance CardShell with needed slots
3. Create SmartCover and ContentMeta
4. Migrate BlogCard as pilot
5. Verify visual consistency
6. Continue with remaining components