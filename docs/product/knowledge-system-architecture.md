# Knowledge System Architecture

> Goal: Unify downloads, vault, library, briefs, premium assets, resources, playbooks, and toolkits into one coherent knowledge hierarchy.

## Current State (7 parallel systems)

| System | Route | Content type | Access |
|--------|-------|-------------|--------|
| Library | `/library/*` | Knowledge shelf | Public |
| Resources | `/resources/*` | Strategic frameworks | Public/mixed |
| Downloads | `/downloads/*` | Downloadable assets | Entitled |
| Vault | `/vault/*` | Premium content | Member |
| Vault Briefs | `/vault/briefs/*` | Operational intelligence | Member |
| Playbooks | `/playbooks/*` | Execution frameworks | Public |
| Toolkits | `/toolkits/*` | Bundled tools | Public |
| Premium Library | `/premium/library` | Premium content | Entitled |

## Canonical Hierarchy

### Tier 1: PUBLIC KNOWLEDGE (authority and entry)
**Purpose:** Establish intellectual leadership. Drive organic discovery.
- **Canon** (`/canon`) — Doctrine. The thesis.
- **Library** (`/library`) — Knowledge shelf. Reference material.
- **Blog/Editorials** (`/blog`, `/editorials`) — Ongoing thinking.
- **Shorts** (`/shorts`) — Signal-level content.
- **Evidence** (`/evidence`) — Proof cases.

### Tier 2: OPERATIONAL KNOWLEDGE (playbooks and intervention support)
**Purpose:** Help users act. Support decision execution.
- **Playbooks** (`/playbooks`) — Execution frameworks. How to act on findings.
- **Resources** (`/resources`) — Strategic frameworks. Merge `/toolkits` into this.
- **Decision Instruments** (`/decision-instruments`) — Tactical tools.

### Tier 3: PREMIUM INTELLIGENCE (governed intelligence library)
**Purpose:** Deliver intelligence that compounds with the diagnostic journey.
- **Vault** (`/vault`) — Premium content library. Canonical home for entitled content.
- **Vault Briefs** (`/vault/briefs`) — Operational intelligence briefs.
- **Inner Circle Content** (`/inner-circle/briefs`, `/inner-circle/reports`) — Member-exclusive.

### Tier 4: PROTECTED DELIVERY (entitled assets)
**Purpose:** Deliver purchased/entitled assets securely.
- **Downloads** (`/downloads`) — Entitled asset delivery. Keep as delivery mechanism, not browsing surface.
- **Premium Library** → Merge into `/vault` or `/inner-circle/dashboard`.

## Consolidation Actions

| Current | Action | Target |
|---------|--------|--------|
| `/toolkits/*` | Merge into `/playbooks` or `/resources` | Redirect |
| `/premium/library` | Merge into `/vault` | Redirect |
| `/downloads` index | Deprioritize as browsing surface | Keep as delivery-only |
| `/resources` | Keep for strategic frameworks | Canonical Tier 2 |

## Navigation Path

1. **Discover** (public) → Canon, Library, Blog, Evidence
2. **Learn** (operational) → Playbooks, Resources, Instruments
3. **Access** (premium) → Vault, Briefs (after Inner Circle or purchase)
4. **Download** (entitled) → Downloads (delivery mechanism, not discovery)
