# Content System Architecture

## Overview
This project uses a dual-layer content system:
1. **Contentlayer Fallback** - Direct imports from `contentlayer/generated`
2. **Unified Content System** - Server-side processed content with enhanced features

## Usage Guidelines

### 1. For Simple Components (like homepage)
```typescript
import { getAllShortsDirect } from '@/lib/content';

const shorts = getAllShortsDirect().slice(0, 3);