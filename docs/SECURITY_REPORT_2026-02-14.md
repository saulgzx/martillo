# Security Report - 2026-02-14

## Scope
- Monorepo dependency audit (`npm audit --audit-level=moderate`)
- Backend runtime hardening items already implemented in this cycle:
  - route-specific rate limiting
  - centralized secure error logging
  - CORS origin validation

## Audit Result
- Total findings: 4 (high)
- Affected packages:
  - `glob` (transitive through `eslint-config-next`)
  - `next` (current major `14.2.35`)

## Details
1. `glob` command injection advisory:
- Source: transitive dependency from `eslint-config-next`
- Auto-fix path requires major upgrade to `eslint-config-next@16.x`
- Impact in this project: tooling/lint dependency, not exposed as runtime endpoint.

2. `next` DoS advisories:
- Source: current Next major (`14.x`)
- Auto-fix path requires major upgrade to `next@16.x`
- Impact in this project: frontend runtime package.

## Mitigation Applied Now
- No `npm audit fix --force` executed to avoid breaking major upgrades in active release cycle.
- Existing backend hardening kept active:
  - `POST /api/auth/login`: 5 requests / 15 minutes
  - `POST /api/auth/register`: 3 requests / hour
  - `POST /api/lots/:lotId/media`: 20 requests / hour per user/IP

## Planned Remediation
1. Create upgrade branch for:
- `next@16.x`
- `eslint-config-next@16.x`
- associated ESLint/TS config alignment
2. Run full regression suite:
- `npm run lint`
- `npm run build`
- smoke tests in Railway/Vercel
3. Merge only after frontend and auth/session flows pass QA.
