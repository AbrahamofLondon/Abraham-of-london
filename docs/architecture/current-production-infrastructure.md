# Current Production Infrastructure

Status: current architecture truth source
Last updated: 2026-05-19

This document records the current production infrastructure boundary for public trust, procurement, and assurance materials. It is not a Cloudflare hardening plan and does not claim controls that have not been configured and verified.

## 1. Current production path

Visitor -> Cloudflare DNS -> Netlify-hosted application

Cloudflare is authoritative DNS for abrahamoflondon.org. Netlify remains the production application host/origin.

## 2. Registrar / DNS / hosting split

| Layer | Current provider |
|---|---|
| Registrar | Namecheap |
| Authoritative DNS | Cloudflare |
| Application hosting / origin | Netlify |
| Database | Neon PostgreSQL |
| Redis / cache / rate-state | Upstash |
| Transactional email | Resend / Private Email where relevant |
| Payments | Stripe where applicable |
| Analytics | Vercel Analytics / PostHog where configured |

Cloudflare authoritative nameservers:

- brian.ns.cloudflare.com
- lana.ns.cloudflare.com

## 3. Current Cloudflare posture

| Capability | Current representation |
|---|---|
| Authoritative DNS | Live |
| Proxy | Staged / conditional by hostname |
| WAF / rate limiting | Staged / conditional by rule and hostname |
| Bot controls | Staged / conditional |
| SSL edge settings | Staged / conditional by proxy posture |
| Zero Trust | Not represented as live for all admin or user access |
| DLP / Data Classification | Not represented as operational for the public application |
| mTLS / client certificates | Not represented as active for public production |
| Authenticated Origin Pulls | Not represented as active |
| Origin certificates on Netlify | Not represented as installed |
| HSTS / preload | Not represented as enabled |
| WORM / external anchoring | Not represented as live |

## 4. Certificate / TLS boundary

Netlify TLS remains relevant for application/origin hosting. Cloudflare edge TLS applies according to proxy posture.

Cloudflare edge certificates may be available for proxied hostnames, while Netlify continues to manage origin/application TLS for the hosted site. Certificate validation and renewal depend on the active DNS/proxy posture.

No HSTS or preload claim should be made unless it is explicitly enabled and tested.

## 5. Claim boundary

Public claims must distinguish DNS authority from proxied edge protection.

Approved wording:

> Cloudflare is used as the authoritative DNS provider for abrahamoflondon.org. Netlify remains the production application host/origin. Cloudflare proxying, WAF/rate-limiting, DLP, Zero Trust, mTLS, and expanded edge-security controls are enabled only where explicitly configured and verified.

Short public wording:

> Cloudflare — authoritative DNS and edge-security services where enabled.

Do not claim blanket Cloudflare WAF, rate limiting, DLP, Zero Trust, mTLS, HSTS, Authenticated Origin Pulls, origin certificates, DDoS protection on all traffic, or full edge protection unless the specific control is configured, tested, and documented for the relevant hostname or workflow.
