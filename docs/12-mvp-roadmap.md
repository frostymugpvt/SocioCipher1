# SocioCipher — MVP Roadmap

> **Version:** 1.0 | **Date:** 2026-05-11

---

## Phase Overview

```
Phase 1: Core Onboarding & Posting        [Weeks 1–6]
Phase 2: Comments & Nested Threads        [Weeks 7–10]
Phase 3: Realtime Rooms                   [Weeks 11–16]
Phase 4: Moderation & Reporting           [Weeks 17–22]
Phase 5: Expiration Engine & Cleanup      [Weeks 23–26]
Phase 6: Trust, Abuse & Legal Tooling     [Weeks 27–34]
```

---

## Phase 1 — Core Onboarding and Posting
**Duration:** 6 weeks  
**Goal:** A working, private, pseudonymous social feed with real accounts.

### Scope
- [ ] OAuth integration (Google + Apple as priority; GitHub optional)
- [ ] Auth identity hashing (HMAC-SHA256 of sub token)
- [ ] Alias generation algorithm + abuse-word blocklist check
- [ ] Onboarding flow (alias reveal, consent, platform explainer)
- [ ] Session token management (24h rolling JWT)
- [ ] Post creation (500 char, tag support, rate limiting)
- [ ] Global feed (chronological, paginated, no algorithm)
- [ ] Post visibility: active / expired states
- [ ] Manual post deletion by author
- [ ] Settings page: alias display, account deletion
- [ ] Dark theme + light theme toggle
- [ ] Basic rate limiting (Redis)
- [ ] TLS, security headers, CSP configured

### Dependencies
- PostgreSQL schema: `auth`, `public.users`, `public.posts`
- Redis: rate limiting, session storage
- Next.js frontend: feed, composer, onboarding screens
- Fastify API: auth, post endpoints

### Success Criteria
- New user can sign up, receive alias, and post in < 3 minutes
- 100% of post creation requests pass through rate limiting
- Auth identity is verifiably isolated from post content in DB
- No PII in any log file (automated test via log scanner)
- Dark theme renders correctly on Chrome, Firefox, Safari, mobile

---

## Phase 2 — Comments and Nested Threads
**Duration:** 4 weeks  
**Goal:** Full discussion capability on any post.

### Scope
- [ ] Comment creation (top-level and nested)
- [ ] Thread retrieval (recursive, max depth 10)
- [ ] Thread collapse/expand at depth 3
- [ ] Parent context display on deep replies
- [ ] Comment expiry tied to parent post expiry
- [ ] Comment rate limiting (30/hour)
- [ ] Thread page layout (post + comments + composer)
- [ ] Hide vote on comments
- [ ] Report on comments

### Dependencies
- Phase 1 complete
- `public.comments` table
- Comment API endpoints (`POST /posts/:id/comments`, `GET /posts/:id/comments`)
- Thread page component with recursive rendering

### Success Criteria
- 10 levels of nesting renders correctly without performance degradation
- Comment expiry correctly cascades when parent post expires
- Thread page loads in < 1.5s for a post with 50 top-level comments

---

## Phase 3 — Realtime Chat Rooms
**Duration:** 6 weeks  
**Goal:** Live room-based discussion with ephemeral messages.

### Scope
- [ ] Room creation (public/unlisted)
- [ ] Room directory (browsing, search)
- [ ] Room join / leave
- [ ] Room message sending (WebSocket)
- [ ] Room message history (last 200 messages on join)
- [ ] WebSocket server (Socket.IO + Redis Pub/Sub)
- [ ] Live message delivery to all room members
- [ ] In-room reply threading (reply_to_id)
- [ ] Room admin controls: mute member, remove member, pin message
- [ ] Room archival (48h inactivity → archive)
- [ ] Message expiry realtime event (`room:message:expired`)
- [ ] Room moderation removal realtime event
- [ ] Sensitive room tag + acknowledgment gate
- [ ] Room mute from user settings

### Dependencies
- Phase 1 + 2 complete
- `public.chat_rooms`, `public.room_messages`, `public.room_memberships`
- Socket.IO server deployed separately
- Redis Pub/Sub configured
- Room API endpoints

### Success Criteria
- Message latency < 200ms for 95th percentile under 500 concurrent room users
- Expired messages show placeholder in real time (within 5 seconds of expiry)
- Room with 200 messages loads in < 2s
- WebSocket reconnection handles gracefully (< 3s reconnect, no message loss in buffer)

---

## Phase 4 — Moderation and Reporting
**Duration:** 6 weeks  
**Goal:** Full community and platform moderation infrastructure.

### Scope
- [ ] Report submission flow (all content types)
- [ ] Ticket ID generation and display
- [ ] Report queue backend (BullMQ moderation queue)
- [ ] Priority tier classification (1–4)
- [ ] Moderation dashboard (internal tool — not public)
- [ ] Moderator actions: warning, content removal, community hide override, temp suspension, perm suspension
- [ ] Moderation notification to affected user
- [ ] Appeals submission flow
- [ ] Appeals review workflow (different moderator assignment)
- [ ] Appeal outcome notifications
- [ ] Community hide voting (threshold: 15 votes → auto-hide)
- [ ] Hide vote weight by trust score
- [ ] Moderation audit logs (`moderation.audit_logs` — append-only)
- [ ] Preservation hold system (retention_hold flag)
- [ ] Basic automated pre-screen (keyword blocklist, link blocklist)
- [ ] `My Reports` in settings (ticket status tracking)

### Dependencies
- Phase 1–3 complete
- `moderation.*` schema
- Internal moderation dashboard (separate admin Next.js app)
- Email notification service for moderation events (via auth provider email if available)

### Success Criteria
- Tier 1 reports appear in moderation queue within 30 seconds
- Moderator can action a report and notify user in < 5 clicks
- Preservation hold demonstrably prevents deletion of flagged content
- Audit log is append-only (verified: no UPDATE/DELETE on table possible via app credential)
- Appeal flow works end-to-end with different moderator assignment

---

## Phase 5 — Expiration Engine and Inactive Account Cleanup
**Duration:** 4 weeks  
**Goal:** Fully automated ephemeral lifecycle for all content and accounts.

### Scope
- [ ] Post deletion cron job (hourly, pg_cron)
- [ ] Comment cascade deletion (with parent post)
- [ ] Room message deletion cron job
- [ ] Inactive account detection (20-day threshold)
- [ ] Account deletion pipeline (alias, posts, comments, memberships, blocks, mutes)
- [ ] Inactivity warning notification (day 17)
- [ ] Voluntary account deletion flow (settings → confirm → 24h purge)
- [ ] Expiry warning push notifications (24h before post expiry)
- [ ] `jobs.retention_jobs` tracking table
- [ ] BullMQ deletion queue with retry logic
- [ ] Realtime expiry events (`post:expired`, `room:message:expired`)
- [ ] OpenSearch deindexing on content expiry
- [ ] Failure recovery: dead-letter queue + alerting for failed deletion jobs
- [ ] Abuse event purge (90-day cron job)
- [ ] Account tombstone (30-day re-creation prevention)
- [ ] Data export endpoint (`GET /account/export`)

### Dependencies
- Phase 1–4 complete
- BullMQ workers deployed
- Redis for job queue backend
- pg_cron extension enabled in PostgreSQL

### Success Criteria
- 100% of eligible posts deleted within 7 days + 1 hour (verified by daily audit query)
- 100% of eligible accounts deleted within 20 days + 24 hours
- Zero expired posts visible in public feed (automated test: query feed and check all `expires_at > NOW()`)
- Failed deletion jobs alert within 5 minutes
- Preservation hold correctly prevents deletion (test: flag content, run deletion job, verify content persists)

---

## Phase 6 — Trust, Abuse, and Legal Response Tooling
**Duration:** 8 weeks  
**Goal:** Production-grade abuse prevention, legal compliance readiness, and trust infrastructure.

### Scope
- [ ] NLP toxicity scoring pipeline (async, post-publish)
- [ ] Shadow-hold for high-toxicity content (score > 0.95)
- [ ] Trust score system (`safety.trust_scores`, recalculation worker)
- [ ] Trust-tiered rate limits (2x for trusted accounts)
- [ ] Sybil detection (alias cluster behavior fingerprinting)
- [ ] Coordinated false-report pattern detection
- [ ] IP hash rate limiting (Cloudflare + Redis layer)
- [ ] Signup burst detection and auto-trust-reduction
- [ ] Safe browsing link checker (async, retroactive removal if unsafe)
- [ ] CSAM hash matching (PhotoDNA or equivalent)
- [ ] Legal hold system (manual hold applied by T&S Lead, bypasses all deletion)
- [ ] Legal request response workflow (internal tool)
- [ ] Law enforcement data disclosure process + minimum necessary disclosure policy
- [ ] NCMEC CyberTipline integration (automated report for confirmed CSAM)
- [ ] On-call moderation alerting (PagerDuty integration)
- [ ] Chaos engineering drills (AZ failure, DB failover simulation)
- [ ] External security penetration test
- [ ] Privacy audit (third-party)

### Dependencies
- Phase 1–5 complete
- NLP model or API (Perspective API as starting point)
- PhotoDNA or equivalent CSAM hash database access
- PagerDuty account
- Legal counsel review of disclosure workflow
- Cloudflare WAF rules configured

### Success Criteria
- Toxicity scoring runs on 100% of posts within 5 seconds of publish
- Zero known-CSAM content survives > 1 hour on platform
- Trust score recalculation runs within 1 hour of a trigger event
- Legal hold demonstrably prevents all deletion paths (test harness)
- Platform passes external security penetration test with no critical findings
- Privacy audit confirms data minimization is enforced structurally

---

## Launch Checklist

### Infrastructure
- [ ] Multi-AZ deployment verified
- [ ] Auto-scaling tested under load (simulate 10x traffic)
- [ ] Database backups and PITR tested (restored successfully)
- [ ] Failover drill completed (DB primary killed, failover < 60s)
- [ ] CDN/WAF (Cloudflare) configured with DDoS rules
- [ ] TLS 1.3 enforced on all endpoints
- [ ] mTLS configured for internal service communication
- [ ] Secrets manager rotation tested

### Privacy and Legal
- [ ] Privacy policy published and linked from all entry points
- [ ] Content policy published
- [ ] Moderation guidelines published
- [ ] GDPR/CCPA/applicable-jurisdiction compliance reviewed by legal counsel
- [ ] Data Processing Agreements signed with all cloud vendors
- [ ] Legal request response workflow documented and tested
- [ ] NCMEC CyberTipline reporting tested (with test case, not live content)
- [ ] Age verification mechanism in place (18+ self-certification + Terms)

### Moderation
- [ ] Moderation team hired and trained (minimum 2 moderators for launch)
- [ ] On-call rotation established
- [ ] Tier 1 emergency response protocol drilled
- [ ] Moderation dashboard operational
- [ ] Appeals review process tested end-to-end

### Product
- [ ] All Phase 1–5 success criteria met
- [ ] Onboarding flow tested with 20 real users (qualitative feedback incorporated)
- [ ] Alias generation tested: no offensive aliases in 10,000 generated samples
- [ ] Expiry engine verified on staging with real data volume
- [ ] Report → action → appeal flow tested end-to-end
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance audit: Lighthouse score > 85 on all key pages
