# READER SYSTEM IMPLEMENTATION GUIDE

## CANON READER vs VAULT READER - DECISION TREE

### Use CANON READER when:
- ✅ Editorial content (essays, articles, long-form writing)
- ✅ 20-40 minute reading experience
- ✅ Authoritative, permanent-feeling content
- ✅ Warm, effortless reading flow
- ✅ Serif typography desired

### Use VAULT READER when:
- ✅ Technical documentation
- ✅ Structured intelligence briefs
- ✅ Dense but controlled information
- ✅ Fast scanning + deep reading
- ✅ Sans-serif, modular layout needed

---

## CANON READER - Complete Example

```tsx
import { CanonReader, CanonCallout } from '@/components/readers/CanonReader';

export function CanonArticleExample() {
  return (
    <CanonReader
      title="The Architecture of Decision"
      subtitle="How institutional memory shapes strategic choice"
      meta={
        <div className="flex items-center gap-4">
          <span>Abraham of London</span>
          <span>•</span>
          <span>24 March 2025</span>
          <span>•</span>
          <span>28 minute read</span>
        </div>
      }
      surfaceOption="A" // Recommended: dark bg, warm bone panels
    >
      {/* Body content with proper typography */}
      <p>
        Institutional memory is not merely a record of past decisions; 
        it is the architecture within which future choices are framed. 
        Every organization builds its own cognitive scaffolding—sometimes 
        intentionally, often by accretion.
      </p>
      
      <h2>The Weight of Precedent</h2>
      
      <p>
        Consider the boardroom where a billion-dollar acquisition is debated. 
        The arguments presented are not born in that moment; they are echoes 
        of decisions made five, ten, twenty years prior.
      </p>
      
      {/* Callout per spec */}
      <CanonCallout type="insight" title="Structural Insight">
        Organizations do not make decisions in vacuums. They make them 
        within architectures built by their own history.
      </CanonCallout>
      
      <h3>Three Layers of Institutional Memory</h3>
      
      <ul>
        <li><strong>Explicit</strong>: Documented policies, minutes, reports</li>
        <li><strong>Tacit</strong>: Unwritten rules, cultural norms, "how we do things here"</li>
        <li><strong>Structural</strong>: Physical and digital systems that enforce certain behaviors</li>
      </ul>
      
      {/* Blockquote per spec */}
      <blockquote>
        The most dangerous precedent is the one you don't know you're setting.
      </blockquote>
      
      <p>
        To change an organization's decision-making architecture requires 
        more than new policies. It requires excavating the tacit and 
        structural layers that silently guide choice.
      </p>
    </CanonReader>
  );
}
```

### Canon Reader Key Rules:
1. **Text NEVER sits directly on unstable backgrounds**
2. **Max width: 65-72ch (non-negotiable)**
3. **Paragraph gap: 1.2em – 1.5em**
4. **Section gap: 2.5em – 3.5em**
5. **No gradients under text**
6. **No animated backgrounds**
7. **No low-opacity text (< 0.7)**

---

## VAULT READER - Complete Example

```tsx
import { 
  VaultReader, 
  VaultDataBlock, 
  VaultCodeBlock,
  VaultCallout 
} from '@/components/readers/VaultReader';

export function VaultTechnicalExample() {
  return (
    <VaultReader
      title="API Rate Limit Implementation v3.2"
      meta={
        <div className="flex items-center gap-3">
          <span className="font-mono">TECHNICAL SPECIFICATION</span>
          <span>•</span>
          <span className="font-mono">VERSION 3.2</span>
          <span>•</span>
          <span className="font-mono">LAST UPDATED: 2025-03-24</span>
        </div>
      }
      keyMetrics={
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="font-mono text-xs uppercase text-white/66">Requests/Min</div>
            <div className="text-2xl font-semibold">1,200</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase text-white/66">Error Rate</div>
            <div className="text-2xl font-semibold">0.04%</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase text-white/66">Avg Latency</div>
            <div className="text-2xl font-semibold">87ms</div>
          </div>
        </div>
      }
      structuredSections={[
        {
          id: "implementation",
          title: "IMPLEMENTATION",
          content: (
            <>
              <p>
                The rate limiting system uses a token bucket algorithm 
                with distributed Redis storage for horizontal scaling.
              </p>
              
              <VaultDataBlock
                title="BUCKET CONFIGURATION"
                data={[
                  { label: "Tokens per minute", value: "1200" },
                  { label: "Bucket size", value: "2400" },
                  { label: "Refill rate", value: "20 tokens/sec" },
                ]}
              />
              
              <VaultCodeBlock language="typescript">
{`interface RateLimitConfig {
  tokensPerMinute: number;
  bucketSize: number;
  refillRate: number;
  namespace: string;
}

const config: RateLimitConfig = {
  tokensPerMinute: 1200,
  bucketSize: 2400,
  refillRate: 20,
  namespace: 'api:v3'
};`}
              </VaultCodeBlock>
            </>
          ),
        },
        {
          id: "error-handling",
          title: "ERROR HANDLING",
          content: (
            <>
              <p>
                When rate limits are exceeded, the system returns HTTP 429 
                with appropriate headers.
              </p>
              
              <VaultCallout type="warning" title="DEPRECATION NOTICE">
                The legacy X-RateLimit headers will be removed in v4.0. 
                Migrate to RateLimit-* headers immediately.
              </VaultCallout>
              
              <table>
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Description</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>RateLimit-Limit</code></td>
                    <td>Requests per minute</td>
                    <td><code>1200</code></td>
                  </tr>
                  <tr>
                    <td><code>RateLimit-Remaining</code></td>
                    <td>Remaining requests</td>
                    <td><code>843</code></td>
                  </tr>
                  <tr>
                    <td><code>RateLimit-Reset</code></td>
                    <td>Seconds until reset</td>
                    <td><code>42</code></td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
        },
      ]}
    />
  );
}
```

### Vault Reader Key Rules:
1. **Font: Sans (Inter), 15-17px body**
2. **Labels: Mono (JetBrains Mono), 10-12px, uppercase**
3. **Background: dark steel (`--ds-background`)**
4. **No serif body text**
5. **No decorative gradients**
6. **No oversized typography**
7. **No cinematic hero interference**
8. **No card-heavy fragmentation in reading flow**

---

## SURFACE OPTIONS (Canon Only)

### Option A (Recommended)
```tsx
<CanonReader surfaceOption="A">
  {/* Page: dark (#030305) */}
  {/* Content panels: warm bone (#0E0E12) */}
  {/* Text: dark on panel */}
</CanonReader>
```

### Option B
```tsx
<CanonReader surfaceOption="B">
  {/* Full page warm bone surface */}
  {/* Dark text across entire page */}
</CanonReader>
```

### Option C (Advanced)
```tsx
<CanonReader surfaceOption="C">
  {/* Dark hero → light reading body */}
  {/* Requires careful contrast management */}
</CanonReader>
```

---

## VALIDATION FUNCTIONS

### Check Canon Compliance:
```typescript
import { validateCanonContent } from '@/components/readers/CanonReader';

const violations = validateCanonContent(yourContent);
// Returns: ["❌ Gradients under text", "❌ Low-opacity text (< 0.7)"]
```

### Check Vault Compliance:
```typescript
import { validateVaultContent } from '@/components/readers/VaultReader';

const violations = validateVaultContent(yourContent);
// Returns: ["❌ VAULT VIOLATION: Serif body text"]
```

---

## PROHIBITED ELEMENTS CHECKLIST

### Canon Prohibitions:
- [ ] Gradients under text
- [ ] Animated backgrounds  
- [ ] Low-opacity text (< 0.7)
- [ ] Amber-on-bone without contrast testing
- [ ] Card-style fragmentation inside body

### Vault Prohibitions:
- [ ] Serif body text
- [ ] Decorative gradients
- [ ] Oversized typography
- [ ] Cinematic hero interference
- [ ] Card-heavy fragmentation in reading flow

---

## TYPOGRAPHY SPECIFICATION

### Canon (Serif Authority):
```
Body:      Cormorant Garamond, 18-20px, 1.7-1.85 line height
H1:        36-44px, weight 300-400, tight spacing
H2:        26-30px, weight 400, medium spacing  
H3:        20-22px, weight 400-500, relaxed spacing
Max width: 65-72ch (non-negotiable)
```

### Vault (Sans Precision):
```
Body:      Inter, 15-17px, 1.6-1.75 line height
Labels:    JetBrains Mono, 10-12px, wide letter spacing, uppercase
Max width: 70-80ch
```

---

## MIGRATION PATH

### From Legacy to Canon:
1. Extract content from old templates
2. Wrap in `<CanonReader>` with appropriate surface option
3. Replace custom callouts with `<CanonCallout>`
4. Run `validateCanonContent()` to check compliance
5. Test contrast ratios (≥ 7:1)

### From Legacy to Vault:
1. Identify technical/structured content
2. Wrap in `<VaultReader>` with structured sections
3. Use `<VaultDataBlock>`, `<VaultCodeBlock>`, `<VaultCallout>`
4. Run `validateVaultContent()` to check compliance
5. Ensure no serif fonts remain

---

## CONTRAST REQUIREMENTS

### Canon:
- Text on panel: ≥ 7:1 contrast
- No text directly on gradient backgrounds
- Amber accents only with sufficient contrast

### Vault:
- Text on background: ≥ 7:1 contrast  
- Mono labels: ≥ 4.5:1 contrast
- Code blocks: ≥ 7:1 contrast

---

## IMPLEMENTATION PRIORITY

1. **Phase 1**: Implement CanonReader for all editorial content
2. **Phase 2**: Implement VaultReader for all technical documentation  
3. **Phase 3**: Migrate existing content to appropriate reader
4. **Phase 4**: Validation and compliance checking
5. **Phase 5**: Performance optimization and accessibility audit

---

## ACCESSIBILITY NOTES

### Screen Readers:
- Both readers use semantic HTML structure
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels where appropriate
- Focus management for interactive elements

### Keyboard Navigation:
- Tab order follows reading flow
- Skip links for long content
- Focus indicators for all interactive elements

### Color & Contrast:
- Meets WCAG AA standards (≥ 4.5:1)
- Large text meets WCAG AAA (≥ 7:1)
- Color not used as sole information carrier