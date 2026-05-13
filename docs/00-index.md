# SocioCipher — Master Deliverables Index

> **Version:** 1.0 | **Date:** 2026-05-11  
> This document is the entry point to the full SocioCipher product architecture.

---

## Document Index

| # | Document | File | Description |
|---|---------|------|-------------|
| 01 | Product Vision | `01-product-vision.md` | Mission, audience, problem, terminology, core principles |
| 02 | Core Features | `02-core-features.md` | All features in full detail |
| 03 | User Flow | `03-user-flow.md` | Full UX flow, screen states, moderation feedback |
| 04 | Privacy Architecture | `04-privacy-architecture.md` | Data model, retention table, encryption, threat model |
| 05 | Moderation System | `05-moderation-system.md` | Dual-layer moderation, queues, escalation, appeals, audit |
| 06 | Content Policy | `06-content-policy.md` | Prohibited content, sensitive content, gray-area framework |
| 07 | Technical Architecture | `07-technical-architecture.md` | Full stack, deployment, observability, failover |
| 08 | Database Schema | `08-database-schema.md` | All tables, columns, indexes, relationships, retention |
| 09 | API Design | `09-api-design.md` | All REST endpoints with request/response examples |
| 10 | Realtime, Security, Deletion | `10-realtime-security-deletion.md` | WebSocket events, threat mitigations, deletion engine |
| 11 | UI & Design System | `11-ui-design-system.md` | Colors, typography, layout, component specs |
| 12 | MVP Roadmap | `12-mvp-roadmap.md` | 6 phases, scope, dependencies, success criteria, launch checklist |
| 13 | Risks & Mitigations | `13-risks-mitigations.md` | All major risks with practical mitigations |

---

## System Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SOCIOCIPHER SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENTS                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐                                │
│  │  Next.js Web App │  │  PWA (mobile)    │                                │
│  │  SSR + CSR       │  │  Web Push        │                                │
│  └────────┬─────────┘  └────────┬─────────┘                                │
│           │ HTTPS/WSS            │ HTTPS/WSS                                │
│  ─────────┼──────────────────────┼──────────────────────────────────────    │
│  GATEWAY  │                      │                                          │
│  ┌────────▼──────────────────────▼─────────┐                               │
│  │  Cloudflare (DDoS, WAF, TLS termination)│                               │
│  │  → Nginx / AWS ALB                      │                               │
│  └──────────┬────────────────────┬─────────┘                               │
│             │ REST/GraphQL        │ WebSocket                               │
│  ───────────┼────────────────────┼──────────────────────────────────────   │
│  COMPUTE    │                    │                                          │
│  ┌──────────▼──────┐   ┌─────────▼──────────┐                             │
│  │  API Servers    │   │  Realtime Server    │                             │
│  │  Fastify/Node   │   │  Socket.IO          │                             │
│  │  ECS Fargate    │   │  ECS Fargate        │                             │
│  │  (multi-AZ)     │   │  (multi-AZ)         │                             │
│  └──────────┬──────┘   └─────────┬──────────┘                             │
│             │                    │                                          │
│  ───────────┼────────────────────┼──────────────────────────────────────   │
│  SERVICES   │                    │                                          │
│  ┌──────────▼────────────────────▼────────────────────────────────────┐   │
│  │ auth │ user │ post │ comment │ room │ report │ search │ notif │ abuse│   │
│  └──────────────────────────────────────────────────────────────────┬─┘   │
│                                                                      │      │
│  ────────────────────────────────────────────────────────────────────┼────  │
│  DATA                                                                │      │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────▼──┐  │
│  │ PostgreSQL 16 │  │  Redis 7     │  │  OpenSearch  │  │  S3 (media) │  │
│  │ Multi-AZ RDS  │  │  Cluster     │  │  Cluster     │  │  (future)   │  │
│  │ Schemas:      │  │  Rate limits │  │  Posts       │  └─────────────┘  │
│  │ auth/public/  │  │  Pub/Sub     │  │  Rooms       │                   │
│  │ moderation/   │  │  Sessions    │  │  Topics      │                   │
│  │ safety/jobs   │  │  Feed cache  │  │              │                   │
│  └───────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  WORKERS (BullMQ)                                                           │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  Deletion    │ │  Abuse/Trust  │ │ Notification │ │  Moderation      │ │
│  │  Worker      │ │  Worker       │ │  Worker      │ │  Worker          │ │
│  └──────────────┘ └───────────────┘ └──────────────┘ └──────────────────┘ │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  OBSERVABILITY                                                              │
│  OpenTelemetry → Jaeger │ Prometheus → Grafana │ Pino → Loki │ PagerDuty  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Summary

| Table | Schema | Key Columns | Retention |
|-------|--------|------------|-----------|
| `auth_identities` | auth | hashed_sub, user_id, provider | Account lifetime |
| `users` | public | alias, trust_score, account_status, last_active_at | Account lifetime |
| `posts` | public | alias, content, expires_at, status, retention_hold | 7 days |
| `comments` | public | alias, post_id, parent_id, depth, expires_at | 7 days (with parent) |
| `chat_rooms` | public | name, visibility, creator_alias, last_message_at | Until deleted |
| `room_messages` | public | room_id, alias, content, expires_at | 7 days |
| `room_memberships` | public | room_id, alias, role, is_muted | Until left/removed |
| `user_blocks` | public | blocker_alias, blocked_alias | Until unblocked |
| `muted_entities` | public | muter_alias, entity_type, entity_value | Until unmuted |
| `reports` | moderation | ticket_id, content_id, category, priority_tier, status | 2 years |
| `moderation_actions` | moderation | moderator_id, action_type, target_alias, reason | 2 years |
| `appeals` | moderation | action_id, appellant_alias, status, deadline_at | 2 years |
| `audit_logs` | moderation | event_type, moderator_id, target_alias (append-only) | 2 years |
| `abuse_events` | safety | event_type, alias, severity, details | 90 days |
| `retention_jobs` | jobs | job_type, target_id, scheduled_at, status | Until completed |

---

## API Endpoint List

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/callback` | OAuth sign-in / sign-up |
| POST | `/auth/signout` | Invalidate session |
| GET | `/auth/me` | Get own identity |
| POST | `/posts` | Create post |
| GET | `/posts/feed` | Get global feed |
| GET | `/posts/:id` | Get single post |
| DELETE | `/posts/:id` | Delete own post |
| POST | `/posts/:id/comments` | Create comment or reply |
| GET | `/posts/:id/comments` | Get comment thread |
| POST | `/rooms` | Create room |
| GET | `/rooms` | Browse room directory |
| POST | `/rooms/:id/join` | Join a room |
| DELETE | `/rooms/:id/leave` | Leave a room |
| POST | `/rooms/:id/messages` | Send room message |
| GET | `/rooms/:id/messages` | Get room message history |
| POST | `/reports` | Submit a report |
| GET | `/reports` | Get own report history |
| POST | `/hide-votes` | Cast a community hide vote |
| POST | `/blocks` | Block an alias |
| DELETE | `/blocks/:alias` | Unblock an alias |
| POST | `/mutes` | Mute an alias, room, or topic |
| DELETE | `/mutes` | Remove a mute |
| POST | `/appeals` | File an appeal |
| GET | `/appeals` | Get own appeals |
| DELETE | `/account` | Request account deletion |
| GET | `/account/export` | Request data export |
| GET | `/account/export/:id` | Poll export status |
| GET | `/search` | Search posts, rooms, topics |

---

## Moderation Workflow Summary

```
Content Created
      │
      ▼
Automated Pre-Screen (synchronous)
  ├── Pass → Published to feed
  └── Fail (keyword/link blocklist) → Blocked, author notified
      │
      ▼
Async Abuse Scoring (< 5 seconds)
  ├── Score < 0.85 → No action
  ├── Score 0.85–0.95 → Live, flagged in Tier 3 queue
  └── Score > 0.95 → Shadow-hold, Tier 2 queue
      │
      ▼
Community Reporting (parallel, ongoing)
  ├── < 15 hide votes → Content stays visible
  └── ≥ 15 hide votes → Community-hidden → Tier 3 queue
      │
      ▼
Moderation Queue (human review)
  ├── Tier 1 (< 1h): CSAM, threats, terrorism
  ├── Tier 2 (< 4h): Doxxing, NCII, coordinated harassment
  ├── Tier 3 (< 24h): Hate speech, harassment, spam, impersonation
  └── Tier 4 (< 72h): Gray area, context-dependent
      │
      ▼
Moderator Decision
  ├── No violation → Report closed, content stays
  ├── Warning → Author notified, content stays
  ├── Removal → Content removed, author notified with appeal instructions
  ├── Suspension → Account suspended, author notified
  └── Emergency → Lockdown + legal referral
      │
      ▼
Appeal (optional, within 14 days)
  ├── Upheld → Action reversed
  └── Denied → Action stands
```

---

## Deletion Workflow Summary

```
Content Lifecycle:
  Created → [7 days pass] → expires_at reached
                │
                ▼
  retention_hold = FALSE?
    YES → Status = 'expired' (hidden) → Deletion job queued (1h delay)
          → Hard DELETE from DB → Deindex from OpenSearch → Realtime event emitted
    NO  → Skip deletion → Hold reviewed every 14 days
          → Hold closes → Content purged within 24h

Account Lifecycle:
  Active → No login for 17 days → Warning notification sent
         → No login for 20 days → deletion_scheduled_at set
         → 24h later → Account + all content purged (if no holds)
         → Tombstone retained 30 days (prevent re-creation abuse)
```

---

## User Journey Map

```
DISCOVERY → ONBOARDING → FIRST POST → COMMUNITY → SAFETY EVENT → DEPARTURE

Discovery:    Landing page (read-only feed preview, alias demo)
              ↓
Onboarding:   OAuth sign-in → Alias generated → Privacy consent → Platform explainer
              ↓
First Post:   Home feed → Composer → Post submitted → Expiry timer visible
              ↓
Community:    Browse feed → Comment on post → Join a room → Chat in real time
              ↓
Safety:       See harmful content → Report → Moderator reviews → Action taken
              OR: Own content reported → Notified → Appeal → Outcome received
              ↓
Departure:    Posts expire naturally (7 days)
              OR: Account expires (20-day inactivity)
              OR: Voluntary deletion (Settings → Delete Account)
```

---

## Policy Checklist

### Privacy Policy Must Cover
- [ ] What data is collected and why
- [ ] What data is explicitly NOT collected
- [ ] How auth identity is separated from public identity
- [ ] Data retention periods for all categories
- [ ] Third-party data sharing conditions
- [ ] User rights (access, deletion, portability, objection)
- [ ] How to exercise rights (contact mechanism)
- [ ] How to report privacy concerns
- [ ] Breach notification procedure

### Content Policy Must Cover
- [ ] Zero-tolerance prohibitions (CSAM, terrorism, doxxing, NCII, threats, trafficking, fraud)
- [ ] Enforcement-required prohibitions (harassment, hate speech, impersonation, spam)
- [ ] Sensitive-but-allowed content (political speech, religious debate, dark humor, mental health)
- [ ] Gray-area framework and how ambiguous cases are handled
- [ ] Community moderation mechanics (hide voting, thresholds)
- [ ] Platform moderation authority and SLAs
- [ ] Preservation of reported content
- [ ] Appeals process
- [ ] Policy evolution and notification process

### Moderation Guidelines Must Cover
- [ ] What moderators can and cannot do
- [ ] Escalation paths by severity tier
- [ ] SLA targets for each tier
- [ ] Prohibited moderation actions (political targeting, identity-based bias)
- [ ] Bias audit process
- [ ] Moderator identity protection
- [ ] Emergency response protocol

---

## Technology Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 (React 19) | SSR + CSR hybrid; great DX; TypeScript |
| Styling | CSS Modules + CSS Variables | Scoped; no framework bloat |
| State | Zustand + TanStack Query | Lightweight; cache-aware |
| API | Fastify + Node.js 22 | 2–3x faster than Express; schema validation |
| Realtime | Socket.IO + Redis Pub/Sub | Proven; horizontally scalable |
| Queue | BullMQ | Redis-backed; delayed jobs; monitoring |
| Database | PostgreSQL 16 (RDS Multi-AZ) | ACID; RLS; partitioning; maturity |
| Cache | Redis 7 | Rate limiting; pub/sub; sessions |
| Search | OpenSearch | Full-text; open-source; relevance |
| Deployment | AWS ECS Fargate | Managed; no EC2 ops |
| CDN/WAF | Cloudflare | DDoS protection; WAF; TLS |
| Observability | OTel + Prometheus + Grafana + Loki | Open-source; no lock-in |
| Secrets | AWS Secrets Manager | Managed rotation; audit trail |
| NLP | Perspective API (Phase 6) | Google-backed; plug-and-play toxicity scoring |
| CSAM | PhotoDNA or equivalent | Industry-standard hash matching |
