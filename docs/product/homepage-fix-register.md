# Homepage Fix Register

Date: 2026-05-09

## P0 — Must Fix Before Public Push

| File / Component | Issue | Fix | Risk if Ignored | Effort | Type |
| --- | --- | --- | --- | --- | --- |
| `components/homepage/CategoryFrontDoor.tsx` | Premature final CTA appears before proof and flagship explanation in real page order | Remove or relocate the front-door final CTA | Homepage closes before it earns trust | Medium | design / copy / code |
| `components/homepage/CategoryFrontDoor.tsx` | Buyer pathways link directly to `Enterprise Assessment` and `Executive Reporting` | Rebuild as qualified pathways or collapse into one evidence-first entry | Earned progression claim becomes non-credible | Medium | copy / design / code |
| `pages/index.tsx` | Applied proof and flagship output arrive after an earlier close | Reorder page so proof and flagship explanation come before the final close | Users are pushed before understanding | Medium | design / code |
| `components/Header.tsx` | Header subtitle says `Diagnostics · Intelligence · Advisory` | Align wording to decision infrastructure positioning | Identity inconsistency | Low | copy |
| `pages/index.tsx` + `components/homepage/CategoryFrontDoor.tsx` | Homepage claims outpace visible proof for memory and verification | Add one output artifact and one continuity artifact | Trust erosion | High | design / copy / code |

## P1 — Should Fix Before Wider Campaign

| File / Component | Issue | Fix | Risk if Ignored | Effort | Type |
| --- | --- | --- | --- | --- | --- |
| `components/homepage/CategoryFrontDoor.tsx` | Trust grid is too long and too claim-dense | Reduce to 4 strongest signals | Mobile fatigue, reduced clarity | Low | copy / design |
| `components/homepage/CategoryFrontDoor.tsx` | Product ladder is overexposed too early | Collapse to start / escalate / verify | Menu feel, cognitive load | Medium | copy / design |
| `pages/index.tsx` `WhoThisIsFor` | Fit filter arrives too late | Move earlier in the journey | Wrong-fit clicks and trust drag | Low | design / code |
| `components/EnhancedFooter.tsx` | Footer is route-heavy for a homepage | Simplify mobile/homepage footer density | Scroll fatigue and route diffusion | Medium | design / code |
| `pages/_document.tsx` and `styles/fonts.css` | Duplicate Google font loading | Consolidate to one loading method | Avoidable network overhead | Low | code / performance |

## P2 — Can Improve After Live Feedback

| File / Component | Issue | Fix | Risk if Ignored | Effort | Type |
| --- | --- | --- | --- | --- | --- |
| `components/homepage/CategoryFrontDoor.tsx` | Category differentiation uses negation more than superiority | Reframe around irreversible advantages | Still sounds defensive | Low | copy |
| `pages/index.tsx` | Duplicate end trust strip | Merge trust exits into one controlled surface | Minor repetition | Low | code / design |
| `components/homepage/CategoryFrontDoor.tsx` | Mobile microcopy is too small in places | Increase support text size and reduce line count | Reduced authority on phones | Low | design |
| `components/proof/PublicProofBlocks.tsx` | Proof is client-fetched | Server-render proof summary if feasible | Late proof loading | Medium | code / performance |

## P3 — Later Polish

| File / Component | Issue | Fix | Risk if Ignored | Effort | Type |
| --- | --- | --- | --- | --- | --- |
| `pages/index.tsx` | Dead homepage section definitions remain in file | Archive or delete inactive sections | Maintenance drag | Medium | code |
| `components/EnhancedFooter.tsx` | Footer gateway count is high | Tailor footer to homepage context | Minor diffusion | Medium | design |
| `components/homepage/*` | Many unused homepage modules remain in repo | Audit and archive or repurpose | Team confusion | Medium | code / architecture |

## Bottom Line

P0 is not cosmetic. It is structural. The homepage must stop contradicting its own earned-progression doctrine before it is pushed publicly.
