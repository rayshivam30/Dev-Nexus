# Path to 9/10

Implementation roadmap for DevNexus. Current scores from the product review. Target is 9+ on every dimension of a focused product: an **AI incident inbox for small engineering orgs** — not a Sentry clone.

| | |
|---|---|
| MVP overall | 6.7 → 9+ |
| Sellable product | 4.5 → 8+ |
| Phases | 4 (P0 integrity → P3 moat) |
| Serious full-time path | ~8–12 weeks |

## Execution status (2026-10-20)

- **Implemented in the repo:** the P0–P3 engineering work has progressed, including a project-level ordered on-call rotation. Alert-policy triggers notify the active person in-app and queue email through the existing Gmail SMTP setup. Legacy user scope columns are backfilled into memberships and removed by a new migration; that migration still needs to be deployed to the database.
- **CI configured:** the E2E workflow starts PostgreSQL and a local SMTP sink, applies Prisma migrations, starts the durable worker, and tests AI-job completion, SLA sweeps, and email delivery without paid external services. A successful CI run still needs to be observed.
- **Still pending outside the repo:** publish `devnexus-sdk` to npm and validate weekly use with a paying or design-partner team. Market fit cannot be established by repository changes.
- **Environment blockers:** this Windows/Bun 1.3.13 install check crashes before validating the lockfile; direct dependency declarations match `package.json`. npm authentication returns `401`, so the package is not published. Docker Desktop's Linux engine is unavailable here, so E2E must be confirmed in GitHub Actions.
- **Email scope:** Gmail SMTP stays in place by request. No Resend/SES integration is planned.

## Define 9/10 before you chase it

A 9 versus Sentry is years of SDK, grouping research, and telemetry.

A 9 as DevNexus means: grouping never floods the board, routing and SLA actually fire, docs match code, workers survive restarts, tests cover the money path, and a 10-person team can run incidents without lying to themselves. This guide is the second definition.

## Current vs target scores (0–10)

Source: product review at time of writing. Target is the bar after P0–P2. Market fit still caps below Sentry unless you stay niche. Market fit target is **8 on purpose** — 9 requires a live customer and a narrower public story.

| Dimension | Current | Target after P2 |
|---|---:|---:|
| Vision | 7.5 | 9.0 |
| Completeness | 5.5 | 9.0 |
| Architecture | 7.0 | 9.0 |
| Security | 7.5 | 9.0 |
| Reliability | 6.5 | 9.0 |
| Code quality | 7.0 | 9.0 |
| Testing | 6.0 | 9.0 |
| Docs / DX | 6.5 | 9.0 |
| Market fit | 4.0 | 8.0 |

## Phase plan

| Phase | Goal | Unblocks score | Do not start next until |
|---|---|---|---|
| **P0 · Integrity** | Make the product true. Group events, fire SLA, fix SDK/docs, kill overclaims. | Completeness, Docs, Market honesty | Ingest upserts by fingerprint; SLA flags write; README matches code |
| **P1 · Spine** | Membership, routing, occurrence UI, durable jobs, search. | Architecture, Completeness, Reliability | User can be on N projects; email/AI jobs in Postgres; search works |
| **P2 · Production** | Env validation, real mail, E2E money path, audit log, CORS preflight. | Security, Testing, Reliability | CI E2E hits login → project → ingest → grouped issue; worker is a process |
| **P3 · Moat** | Alert policies, releases, npm SDK, on-call lite, usage limits. | Market fit, Vision | One paying or design-partner team using it weekly |

## Build order (do this sequence)

1. Fingerprint grouping + occurrence events (ingest).
2. SLA sweeper that writes breach flags and emits events.
3. SDK package exports, default URL, README/model truth.
4. `ProjectMembership` + `TeamMembership` tables; delete single `projectId`/`teamId` as source of truth.
5. Routing engine (rules, then AI suggestion — never silent auto-assign without a rule).
6. Job table for AI + email; stop in-memory queues in production.
7. Issue list: count, last seen, trend, resolve-all, merge.
8. Tests on ingest grouping, SLA, membership, CSRF, GitHub HMAC.
9. Playwright: register org → create project → ingest → grouped issue → assign → resolve.
10. Only then: alert policies, billing, npm publish.

---

## Workstreams

### P0 — Event grouping

Today `generateFingerprint()` is computed then `prisma.issue.create()` always runs (`ingest/route.ts`). Count-of-similar is a decoration.

Add unique `(projectId, fingerprint)` where `deletedAt` is null.

- **On hit:** increment `timesSeen`, set `lastSeenAt`, append an `IssueEvent` sample (cap 50), reopen if `RESOLVED` and a regression window applies.
- **On miss:** create. Never spawn N tickets from one loop.

**Files:** `prisma/schema.prisma`, `ingest/route.ts`, issue list UI. AI worker should analyze the group, not each occurrence.

### P0 — SLA that actually fires

`calculateSLADeadlines` exists; `responseBreached` is only read. `EVENTS.SLA_BREACHED` is never `emitEvent`’d.

Worker every 30s: issues where deadline < now, not breached, status not `RESOLVED`. Set flags, notify assignee + org staff, emit SSE. Response SLA starts at create; pause it when status leaves `OPEN` (`acceptedAt` already exists).

### P0 — Truth in packaging and docs

Align Gemini model name, ingest URL, SDK version, and exports. Add `"./react"` to `sdk/package.json`. Run SDK tests in CI. Remove Kubernetes claims until manifests exist. Delete “virtual SRE” until routing ships.

### P1 — Tenancy and routing

Replace `User.projectId` / `teamId` as the access source. Membership rows: `userId`, `projectId`, `role`. `RoutingRule`: `projectId`, match (path prefix, tag, severity, message regex), `targetTeamId`. AI may suggest a team; a rule or a manager confirms. Skills stay as hints, not authority.

### P1 — Durable jobs

Job model: type (`AI_ANALYZE` | `EMAIL` | `SLA_SWEEP`), payload JSON, status, `runAfter`, attempts, `lockedAt`, `lockedBy`. A bun worker process (not Next instrumentation) claims rows. Email leaves the in-process array. AI worker already halfway — move it off `Issue.logs`.

### P2 — Tests, mail, security leftovers

Zod-validate env at boot. Ingest `OPTIONS` must not use empty `allowedOrigins`. Keep Gmail SMTP as the email transport by product direction. Playwright money path with PostgreSQL service in the E2E workflow. `AuditLog` table surfaced in admin UI. Single JWT library.

### P3 — Moat, not a clone

`AlertPolicy` (severity + count + window → notify). Release + source map already exist — make “this broke in v1.4” a first-class filter. npm publish the SDK. Soft usage limits from `PlanType` (events/day). On-call: project-level ordered rotation with scheduled shifts and Gmail notification is implemented; Slack delivery and external customer validation remain operational follow-ups.

## Do not build (kills the 9)

| Temptation | Why it drops the score |
|---|---|
| Session replay / APM / mobile native SDKs | Years of work; dilutes the inbox wedge |
| Silent AI auto-assign with no rules | Wrong assignee is worse than no assignee |
| Kubernetes before grouping + jobs | You will orchestrate a product that still floods tickets |
| Stripe before a design partner | Billing a broken grouping model is premature |
| More landing-page motion | Does not move any review dimension |

## Exit rubric (score 9 only if all true)

**Product**

- 1,000 identical errors = 1 open issue with count 1000.
- Regression reopens.
- SLA breach notifies someone.
- Routing follows a visible rule.
- README sentences are greppable in code.

**Engineering**

- Jobs survive restart.
- Membership is N:N.
- CI unit + SDK + E2E money path.
- Env invalid = process refuses to start.
- Metrics show ingest, group rate, AI lag, SLA breaches.

### Re-rate after each phase

- After **P0** you should already be ~8 on Completeness and Docs.
- After **P1**, Architecture and Reliability cross 9.
- After **P2**, Testing and Security cross 9.
- Market fit waits on a real team using it — that is **P3**.
