# SocioCipher — Technical Architecture

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                │
│  Next.js (React) Web App     │    Progressive Web App (PWA)            │
│  - SSR for feed/discovery    │    - Offline-capable shell              │
│  - CSR for realtime rooms    │    - Push notifications via Web Push    │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼─────────────────────────────────────────┐
│                            GATEWAY LAYER                               │
│  Nginx / Cloudflare (DDoS protection, TLS termination, rate limiting)  │
│  API Gateway (route, auth token validation, request ID injection)       │
└──────┬───────────────────────┬────────────────────────────────────────┘
       │ REST/GraphQL           │ WebSocket
┌──────▼──────────┐    ┌───────▼────────────────────────────────────────┐
│   API SERVERS   │    │              REALTIME SERVER                    │
│  Node.js /      │    │  Node.js + Socket.IO (or custom WS server)     │
│  Fastify        │    │  Handles: room messages, live updates,          │
│  Horizontally   │    │  expiry broadcasts, moderation events           │
│  scalable       │    │  Backed by Redis Pub/Sub for multi-instance     │
└──────┬──────────┘    └───────────────────────┬─────────────────────────┘
       │                                        │
┌──────▼────────────────────────────────────────▼────────────────────────┐
│                          SERVICE LAYER                                  │
│  Auth Service │ Post Service │ Room Service │ Moderation Service        │
│  User Service │ Search Service │ Notification Service │ Report Service  │
└──────┬────────────────────────────────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                    │
│  PostgreSQL (primary)  │  Redis (cache + pub/sub + rate limits)        │
│  OpenSearch (full-text search)  │  S3-compatible (media storage)       │
└───────────────────────────────────────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────────────────────────────────┐
│                         WORKER LAYER                                   │
│  BullMQ (job queue) workers:                                           │
│  - Deletion Engine Worker                                              │
│  - Abuse Detection Worker                                              │
│  - Notification Worker                                                 │
│  - Report Processing Worker                                            │
│  - Trust Score Recalculation Worker                                    │
│  - Search Index Sync Worker                                            │
└───────────────────────────────────────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY LAYER                              │
│  OpenTelemetry traces │ Prometheus metrics │ Loki logs                 │
│  Grafana dashboards │ PagerDuty alerting                               │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Stack

### Framework: Next.js 15 (App Router)
**Why Next.js:**
- Server-side rendering (SSR) for the public feed and discovery pages — good for performance and ensures content is available without JS hydration delay
- Client-side rendering (CSR) for chat rooms and live comment threads — needed for WebSocket connections
- Built-in API routes for simple BFF (Backend-for-Frontend) patterns
- Edge runtime support for fast middleware (auth checks, rate limit pre-checks)
- Strong TypeScript support; ecosystem maturity

### Key Frontend Libraries
| Library | Purpose |
|---------|---------|
| React 19 | UI component model |
| TypeScript | Type safety |
| Socket.IO client | WebSocket for realtime rooms |
| SWR / TanStack Query | Data fetching, caching, optimistic updates |
| Zustand | Lightweight client state (auth state, UI state) |
| date-fns | Date formatting and expiry countdowns |
| DOMPurify | Client-side XSS sanitization |

### Styling
- CSS Modules for component-scoped styles
- CSS custom properties (variables) for theming (dark/light)
- No Tailwind (bloat not justified for this product scale in Phase 1)

### PWA Configuration
- Service Worker via next-pwa
- Web Push notifications for moderation and expiry alerts
- Offline shell for browsing cached feed

---

## 3. Backend Stack

### Runtime: Node.js 22 LTS with Fastify
**Why Fastify over Express:**
- Significantly faster request throughput (2–3x in benchmarks)
- Built-in schema validation via JSON Schema
- Plugin architecture well-suited for microservice-lite decomposition
- TypeScript-first ecosystem

### Service Decomposition (Monolith-first, microservice-ready)
Phase 1: Single deployable Fastify application with internal service modules  
Phase 3+: Split into separate services as scale demands

| Service | Responsibility |
|---------|---------------|
| `auth-service` | OAuth callback, token hashing, session management |
| `user-service` | Alias generation, account CRUD, trust score |
| `post-service` | Post creation, feed retrieval, expiry scheduling |
| `comment-service` | Comment/reply CRUD, thread retrieval |
| `room-service` | Room CRUD, membership, message handling |
| `realtime-service` | WebSocket connections, pub/sub relay |
| `report-service` | Report intake, queue management, moderation actions |
| `search-service` | OpenSearch indexing and query |
| `notification-service` | In-app and push notification delivery |
| `deletion-service` | Scheduled content and account expiry |
| `abuse-service` | Toxicity scoring, spam detection, trust scoring |

### API Style: REST + WebSocket
- REST for all CRUD operations and queries
- WebSocket for realtime room messaging and live event feeds
- GraphQL considered but rejected for Phase 1 (adds complexity, over-fetching not a problem at this scale)

---

## 4. Database: PostgreSQL 16

**Why PostgreSQL:**
- ACID compliance is essential for financial/legal-grade data integrity (moderation actions, audit logs)
- Row-level security (RLS) for fine-grained access control
- Excellent support for JSONB for flexible metadata storage
- pg_cron for scheduled tasks (deletion jobs)
- Partitioning support for time-based content tables (posts, messages)
- Mature replication and backup ecosystem

### Schema Organization
- `auth` schema: auth_identities (restricted access)
- `public` schema: users, aliases, posts, comments, rooms, messages
- `moderation` schema: reports, actions, appeals, audit_logs, preservation_holds
- `safety` schema: abuse_events, trust_scores, rate_limit_counters

### Performance Strategy
- Connection pooling via PgBouncer
- Read replicas for feed queries and search
- Time-based partitioning on posts, room_messages (monthly partitions)
- Aggressive indexing on: created_at, expires_at, alias, room_id, parent_id

---

## 5. Cache Layer: Redis 7

**Why Redis:**
- Sub-millisecond latency for rate limiting (INCR + EXPIRE pattern)
- Pub/Sub for WebSocket message fan-out across multiple realtime server instances
- Short-lived session token storage
- Feed pre-computation cache (hot feed cached for 30 seconds)
- Room presence tracking (who is currently in which room — ephemeral)

### Redis Key Patterns
```
rate:post:{alias_hash}          TTL: 1h     (post rate limit counter)
rate:msg:{alias_hash}:{room_id} TTL: 1h     (message rate limit counter)
rate:ip:{ip_hash}               TTL: 24h    (IP-level rate limit)
session:{session_id}            TTL: 24h    (session data)
feed:global:cache               TTL: 30s    (cached global feed page 1)
room:presence:{room_id}         TTL: 5m     (set of active alias hashes)
pub:room:{room_id}              Channel     (pub/sub channel for room messages)
pub:moderation                  Channel     (pub/sub for moderation events)
```

---

## 6. Realtime Messaging: Socket.IO + Redis Pub/Sub

### Architecture
```
Client A ──WebSocket──→ Realtime Server 1 ──→ Redis Pub/Sub ──→ Realtime Server 2 ──WebSocket──→ Client B
```

- Multiple realtime server instances share state via Redis Pub/Sub
- Each room has a Redis channel: `pub:room:{room_id}`
- Messages are published to Redis by the API server when a room message is saved
- Realtime servers subscribe to all relevant room channels and push to connected clients

### Events Emitted to Clients
| Event | Trigger | Payload |
|-------|---------|---------|
| `room:message` | New message in room | message object |
| `room:message:expired` | Message TTL reached | {message_id, room_id} |
| `room:message:removed` | Moderator removed | {message_id, room_id, reason} |
| `post:expired` | Post TTL reached | {post_id} |
| `comment:expired` | Comment TTL reached | {comment_id} |
| `moderation:action` | Content acted on (author only) | {content_id, action, reason} |
| `account:warning` | Inactivity warning | {days_remaining} |

---

## 7. Queue Workers: BullMQ + Redis

**Why BullMQ:**
- Redis-backed (consistent with existing infra)
- Supports delayed jobs (critical for expiry scheduling)
- Retry logic, dead-letter queues, concurrency controls
- Built-in monitoring dashboard (Bull Board)

### Job Queues

| Queue | Jobs | Worker concurrency |
|-------|------|-------------------|
| `deletion-queue` | `delete-post`, `delete-account`, `purge-preserved-content` | 5 |
| `abuse-queue` | `score-content-toxicity`, `check-spam-pattern`, `recalculate-trust` | 10 |
| `notification-queue` | `send-expiry-warning`, `send-moderation-notice`, `send-push` | 20 |
| `report-queue` | `classify-report`, `check-auto-action` | 5 |
| `search-queue` | `index-post`, `deindex-post`, `index-room` | 5 |
| `moderation-queue` | `process-community-hide`, `escalate-report` | 3 |

---

## 8. Search: OpenSearch

**Why OpenSearch over Postgres full-text:**
- Purpose-built for search relevance and full-text indexing
- Supports fuzzy matching, phrase search, highlighting
- Scales independently of the main database
- Open-source (no license concerns vs. Elasticsearch)

### Indexed Entities
- Posts (content text, tags, created_at, room_id)
- Rooms (name, description, created_at)
- Tags/topics (tag name, post count in last 7 days)

### Search Constraints
- Only active (non-expired) posts are indexed
- Deletion job deindexes posts when they expire or are removed
- No user search — aliases are not indexed or searchable
- Search results are not personalized

---

## 9. Encryption Strategy

### At Rest
- PostgreSQL: disk-level AES-256 encryption (managed by cloud provider)
- Redis: no sensitive data (rate counters and session tokens are non-sensitive)
- Moderation preservation store: application-layer AES-256-GCM on top of disk encryption
- Media (future phase): client-side hash verification + server-side encryption at rest

### In Transit
- All external traffic: TLS 1.3 (enforce via Nginx / Cloudflare)
- Internal service-to-service: mTLS with short-lived certificates (Consul or AWS ACM Private CA)
- WebSocket connections: WSS only (no WS fallback)
- Database connections: TLS enforced in pg connection string

### Key Management
- AWS Secrets Manager (or HashiCorp Vault for self-hosted)
- HMAC key for auth token hashing: quarterly rotation
- Application-layer encryption keys: 90-day rotation with re-encryption

---

## 10. Abuse Detection Pipeline

```
POST /api/posts (create post)
        │
        ▼
[1] Synchronous checks (< 50ms, blocks response)
        ├── Rate limit check (Redis INCR)
        ├── Spam burst check (Redis sliding window)
        ├── Known-bad keyword exact match (Redis SET lookup)
        └── Phishing link check (Redis blocklist)
                │
                ▼ (pass)
[2] Save to database → Return 201 to client
        │
        ▼
[3] Async abuse worker (< 5 sec, non-blocking)
        ├── Toxicity NLP classifier (internal model or Perspective API)
        ├── Near-duplicate fuzzy hash check
        ├── Coordinated posting pattern check
        └── Trust score evaluation
                │
                ├── Score > 0.95 → shadow-hold (remove from feed, queue for review)
                ├── Score 0.85-0.95 → flag in moderation queue (stays live)
                └── Score < 0.85 → no action, normal lifecycle
```

---

## 11. Logging and Observability

### What Is Logged
| Event | Logged? | PII in Log? |
|-------|---------|------------|
| HTTP request (method, path, status, duration) | Yes | No (IP hashed, no user ID) |
| Auth success/failure | Yes | No (session ID only) |
| Post/comment creation | Yes | No (alias, not auth identity) |
| Report submission | Yes | No (alias, ticket ID) |
| Moderation action | Yes | No (alias, action type) |
| Deletion job execution | Yes | No (content ID only) |
| Error/exception | Yes | No (sanitized) |
| User content body | No | N/A |
| Raw IP address | No | N/A |
| Auth identity (hashed sub) | Audit log only | Only in restricted audit log |

### Stack
- **Traces:** OpenTelemetry → Jaeger or AWS X-Ray
- **Metrics:** Prometheus → Grafana dashboards
- **Logs:** Pino (Fastify) → Loki → Grafana
- **Alerts:** Grafana alerts → PagerDuty
- **Error tracking:** Sentry (with PII scrubbing config)

---

## 12. Deployment Architecture

### Cloud: AWS (or equivalent GCP/Azure)

```
                          ┌──────────────────┐
                          │   Cloudflare     │
                          │ (DDoS, CDN, WAF) │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │  Application     │
                          │  Load Balancer   │
                          └──┬───────────┬───┘
                    ┌────────▼───┐   ┌───▼────────┐
                    │ API Server │   │ Realtime   │
                    │ (3x AZ)    │   │ Server     │
                    │ ECS Fargate│   │ (2x AZ)    │
                    └────────────┘   └────────────┘
                             │
               ┌─────────────┼──────────────┐
               │             │              │
        ┌──────▼──┐   ┌──────▼──┐   ┌──────▼──┐
        │  RDS    │   │ Redis   │   │OpenSearch│
        │Postgres │   │(Cluster)│   │(Cluster) │
        │Multi-AZ │   │         │   │          │
        └─────────┘   └─────────┘   └──────────┘
```

### Container Orchestration
- ECS Fargate (managed, no EC2 to patch)
- ECR for container registry
- Auto-scaling based on CPU and request queue depth

### Environments
- `dev` — single-instance, minimal resources, non-production data
- `staging` — production-like topology, anonymized data, used for pre-release testing
- `production` — Multi-AZ, auto-scaling, full observability

---

## 13. Failover and Backup Strategy

### Database
- PostgreSQL Multi-AZ (RDS) — automatic failover in < 60 seconds
- Daily automated snapshots — retained 30 days
- Point-in-time recovery (PITR) — enabled, 7-day window
- Read replicas — 2 replicas in separate AZs for read distribution

### Redis
- Redis Cluster mode — automatic slot-based failover
- Persistence: AOF (append-only file) for rate-limit recovery after restart
- Session data: ephemeral (sessions expire within 24h; loss is acceptable)

### Application
- Multiple instances per AZ (minimum 2 API, 2 realtime per AZ)
- Health checks: `/health/live` (alive) and `/health/ready` (DB + Redis connected)
- Circuit breaker pattern for external service calls (abuse detection, notifications)

### Disaster Recovery
- RTO (Recovery Time Objective): < 15 minutes
- RPO (Recovery Point Objective): < 5 minutes (PITR)
- Full DR runbook tested quarterly
- Chaos engineering drills semi-annually (simulate AZ failure, DB failover, cache loss)

---

## 14. Technology Choices — Summary Rationale

| Component | Choice | Why |
|-----------|--------|-----|
| Frontend | Next.js 15 | SSR + CSR hybrid; production-ready; strong ecosystem |
| API runtime | Node.js 22 + Fastify | Performance; async I/O fits this workload |
| Database | PostgreSQL 16 | ACID; RLS; partitioning; excellent for moderation data |
| Cache | Redis 7 | Rate limiting; pub/sub; session storage |
| Realtime | Socket.IO + Redis Pub/Sub | Proven; scales horizontally; rich client library |
| Queue | BullMQ | Redis-backed; delayed jobs; monitoring tools |
| Search | OpenSearch | Full-text; relevance; open-source |
| Deployment | AWS ECS Fargate | Managed containers; no EC2 maintenance |
| CDN/DDoS | Cloudflare | Industry standard; privacy-respecting WAF rules |
| Observability | OpenTelemetry + Grafana stack | Open-source; no vendor lock-in |
| Secrets | AWS Secrets Manager | Managed; audited; rotation support |
