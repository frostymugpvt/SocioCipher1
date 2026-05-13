# SocioCipher — Database Schema

> **Version:** 1.0 | **Date:** 2026-05-11

---

## Schema Namespaces

| Schema | Purpose | Access Level |
|--------|---------|-------------|
| `auth` | Auth identity mappings | Restricted (elevated credentials only) |
| `public` | All user-facing content | Standard application credentials |
| `moderation` | Reports, actions, audit logs | Moderator credentials |
| `safety` | Abuse events, trust scores | Safety service credentials |
| `jobs` | Retention job tracking | Worker credentials |

---

## 1. `auth.auth_identities`

Maps hashed OAuth tokens to internal user IDs. **Most restricted table in the system.**

```sql
CREATE TABLE auth.auth_identities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    provider        VARCHAR(20) NOT NULL,         -- 'google' | 'apple' | 'github'
    hashed_sub      VARCHAR(128) NOT NULL UNIQUE, -- HMAC-SHA256 of OAuth sub token
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_identities_hashed_sub ON auth.auth_identities(hashed_sub);

-- Row-level security: only auth service role can SELECT/INSERT/UPDATE
ALTER TABLE auth.auth_identities ENABLE ROW LEVEL SECURITY;
```

**Retention:** Lifetime of account. Deleted with account.  
**Access:** Auth service only. No joins to this table from public schema queries.

---

## 2. `public.users`

Internal user record. Contains no PII — only system metadata.

```sql
CREATE TABLE public.users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias               VARCHAR(20) NOT NULL UNIQUE,    -- e.g. "ΔkR7•ψ2x"
    trust_score         SMALLINT NOT NULL DEFAULT 50,   -- 0–100
    account_status      VARCHAR(20) NOT NULL DEFAULT 'active',
                        -- 'active' | 'suspended_temp' | 'suspended_perm' | 'deleted'
    suspension_until    TIMESTAMPTZ,                    -- NULL if not temporarily suspended
    created_at          TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW()),
    last_active_at      TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW()),
    deletion_scheduled_at TIMESTAMPTZ,                  -- set when 20-day inactivity reached
    is_under_investigation BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_trust_score CHECK (trust_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_users_alias ON public.users(alias);
CREATE INDEX idx_users_last_active ON public.users(last_active_at)
    WHERE account_status = 'active';
CREATE INDEX idx_users_deletion_scheduled ON public.users(deletion_scheduled_at)
    WHERE deletion_scheduled_at IS NOT NULL;
```

**Retention:** Active account lifetime. Soft-deleted then purged within 24h.  
**Note:** No email, name, phone, or any PII field exists in this table.

---

## 3. `public.posts`

Feed posts. Time-partitioned by month for performance.

```sql
CREATE TABLE public.posts (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    alias           VARCHAR(20) NOT NULL,               -- denormalized for privacy (not user_id)
    content         TEXT NOT NULL,
    content_hash    VARCHAR(64),                        -- SHA-256 for near-duplicate detection
    tags            VARCHAR(50)[] DEFAULT '{}',         -- max 3 tags
    is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE,
    room_id         UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
                                                        -- NULL = global feed post
    created_at      TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW()),
    expires_at      TIMESTAMPTZ NOT NULL,               -- created_at + 7 days
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
                    -- 'active' | 'community_hidden' | 'mod_removed' | 'expired' | 'preserved'
    hide_vote_count SMALLINT NOT NULL DEFAULT 0,
    report_count    SMALLINT NOT NULL DEFAULT 0,
    toxicity_score  NUMERIC(4,3),                       -- 0.000–1.000, NULL if not scored
    retention_hold  BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE = do not delete at expiry
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE public.posts_2026_05 PARTITION OF public.posts
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_posts_alias ON public.posts(alias);
CREATE INDEX idx_posts_expires_at ON public.posts(expires_at)
    WHERE status = 'active' AND retention_hold = FALSE;
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC)
    WHERE status = 'active';
CREATE INDEX idx_posts_room_id ON public.posts(room_id)
    WHERE room_id IS NOT NULL;
CREATE INDEX idx_posts_content_hash ON public.posts(content_hash);
```

**Retention:** 7 days from created_at. Deletion job runs hourly.  
**Note:** `alias` stored directly, not `user_id` — privacy isolation by design.

---

## 4. `public.comments`

Comments and nested replies on posts.

```sql
CREATE TABLE public.comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL,                      -- references posts (no FK across partition)
    parent_id       UUID REFERENCES public.comments(id) ON DELETE CASCADE,
                                                        -- NULL = top-level comment
    alias           VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    depth           SMALLINT NOT NULL DEFAULT 0,        -- 0=top-level, max 10
    created_at      TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW()),
    expires_at      TIMESTAMPTZ NOT NULL,               -- matches parent post expires_at
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    hide_vote_count SMALLINT NOT NULL DEFAULT 0,
    report_count    SMALLINT NOT NULL DEFAULT 0,
    retention_hold  BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_depth CHECK (depth BETWEEN 0 AND 10)
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id)
    WHERE status = 'active';
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_expires_at ON public.comments(expires_at)
    WHERE status = 'active' AND retention_hold = FALSE;
CREATE INDEX idx_comments_alias ON public.comments(alias);
```

**Retention:** Expires with parent post. Cascades on parent deletion.

---

## 5. `public.chat_rooms`

```sql
CREATE TABLE public.chat_rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) NOT NULL,
    description     VARCHAR(200),
    creator_alias   VARCHAR(20) NOT NULL,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'public',
                    -- 'public' | 'unlisted' | 'platform_moderated'
    is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
                    -- 'active' | 'archived' | 'removed'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW()),
    last_message_at TIMESTAMPTZ,
    archived_at     TIMESTAMPTZ,                        -- set after 48h inactivity
    message_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_rooms_visibility ON public.chat_rooms(visibility, last_message_at DESC)
    WHERE status = 'active';
CREATE INDEX idx_rooms_creator ON public.chat_rooms(creator_alias);
```

**Retention:** Active until deleted or 90 days inactive. Creator can delete.

---

## 6. `public.room_messages`

Time-partitioned like posts.

```sql
CREATE TABLE public.room_messages (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    alias           VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    reply_to_id     UUID,                               -- for threaded replies within room
    created_at      TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW()),
    expires_at      TIMESTAMPTZ NOT NULL,               -- created_at + 7 days
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    retention_hold  BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_room_messages_room_id ON public.room_messages(room_id, created_at DESC)
    WHERE status = 'active';
CREATE INDEX idx_room_messages_expires ON public.room_messages(expires_at)
    WHERE status = 'active' AND retention_hold = FALSE;
```

---

## 7. `public.room_memberships`

Server-side only — not exposed via any public API. Used for auth and moderation.

```sql
CREATE TABLE public.room_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    alias       VARCHAR(20) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'member',  -- 'member' | 'admin'
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_muted    BOOLEAN NOT NULL DEFAULT FALSE,         -- room admin muted this member
    muted_until TIMESTAMPTZ,
    UNIQUE (room_id, alias)
);

CREATE INDEX idx_memberships_alias ON public.room_memberships(alias);
CREATE INDEX idx_memberships_room ON public.room_memberships(room_id);
```

---

## 8. `public.user_blocks`

```sql
CREATE TABLE public.user_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_alias   VARCHAR(20) NOT NULL,
    blocked_alias   VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (blocker_alias, blocked_alias)
);

CREATE INDEX idx_blocks_blocker ON public.user_blocks(blocker_alias);
CREATE INDEX idx_blocks_blocked ON public.user_blocks(blocked_alias);
```

---

## 9. `public.muted_entities`

Unified mute table for aliases, rooms, and topics.

```sql
CREATE TABLE public.muted_entities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    muter_alias     VARCHAR(20) NOT NULL,
    entity_type     VARCHAR(20) NOT NULL,   -- 'alias' | 'room' | 'topic'
    entity_value    VARCHAR(100) NOT NULL,  -- the alias, room_id, or topic tag
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (muter_alias, entity_type, entity_value)
);

CREATE INDEX idx_muted_muter ON public.muted_entities(muter_alias, entity_type);
```

---

## 10. `moderation.reports`

```sql
CREATE TABLE moderation.reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       VARCHAR(20) NOT NULL UNIQUE,        -- e.g. "RPT-2847361"
    reporter_alias  VARCHAR(20),                        -- NULL if reporter account deleted
    content_type    VARCHAR(20) NOT NULL,               -- 'post' | 'comment' | 'room_message' | 'room'
    content_id      UUID NOT NULL,
    category        VARCHAR(50) NOT NULL,
    additional_context TEXT,
    priority_tier   SMALLINT NOT NULL,                  -- 1=critical, 2=high, 3=standard, 4=low
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
                    -- 'pending' | 'under_review' | 'resolved_no_action'
                    -- | 'resolved_warning' | 'resolved_removed' | 'resolved_suspended'
    assigned_mod_id VARCHAR(50),                        -- internal mod pseudonymous ID
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT
);

CREATE INDEX idx_reports_status_priority ON moderation.reports(priority_tier, created_at)
    WHERE status = 'pending';
CREATE INDEX idx_reports_content ON moderation.reports(content_type, content_id);
CREATE INDEX idx_reports_ticket ON moderation.reports(ticket_id);
```

**Retention:** 2 years from created_at.

---

## 11. `moderation.moderation_actions`

```sql
CREATE TABLE moderation.moderation_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES moderation.reports(id),
    moderator_id    VARCHAR(50) NOT NULL,               -- internal pseudonymous mod ID
    action_type     VARCHAR(30) NOT NULL,
                    -- 'no_action' | 'warning' | 'content_removal' | 'community_hide_override'
                    -- | 'suspension_temp' | 'suspension_perm' | 'emergency_lockdown' | 'legal_referral'
    content_type    VARCHAR(20),
    content_id      UUID,
    target_alias    VARCHAR(20) NOT NULL,
    reason_category VARCHAR(50) NOT NULL,
    reason_notes    TEXT,
    suspension_days SMALLINT,                           -- for temp suspensions
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    appeal_filed    BOOLEAN NOT NULL DEFAULT FALSE,
    appeal_id       UUID
);

CREATE INDEX idx_mod_actions_alias ON moderation.moderation_actions(target_alias);
CREATE INDEX idx_mod_actions_created ON moderation.moderation_actions(created_at DESC);
```

**Retention:** 2 years. Immutable after creation.

---

## 12. `moderation.appeals`

```sql
CREATE TABLE moderation.appeals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id       UUID NOT NULL REFERENCES moderation.moderation_actions(id),
    appellant_alias VARCHAR(20) NOT NULL,
    reason_category VARCHAR(50) NOT NULL,
    context_text    TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
                    -- 'pending' | 'upheld' | 'denied' | 'partially_upheld'
    reviewer_mod_id VARCHAR(50),
    review_notes    TEXT,
    filed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    deadline_at     TIMESTAMPTZ NOT NULL               -- filed_at + 14 days
);

CREATE INDEX idx_appeals_action ON moderation.appeals(action_id);
CREATE INDEX idx_appeals_alias ON moderation.appeals(appellant_alias);
CREATE INDEX idx_appeals_status ON moderation.appeals(status, deadline_at)
    WHERE status = 'pending';
```

---

## 13. `moderation.audit_logs`

Immutable append-only log of all moderation events.

```sql
CREATE TABLE moderation.audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(50) NOT NULL,
    moderator_id    VARCHAR(50) NOT NULL,
    target_alias    VARCHAR(20),
    content_type    VARCHAR(20),
    content_id      UUID,
    action_id       UUID,
    report_id       UUID,
    appeal_id       UUID,
    metadata        JSONB,                              -- additional structured context
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No UPDATE or DELETE allowed on this table (enforced via DB role permissions)
CREATE INDEX idx_audit_created ON moderation.audit_logs(created_at DESC);
CREATE INDEX idx_audit_target ON moderation.audit_logs(target_alias);
```

**Retention:** 2 years. Append-only enforced at DB role level.

---

## 14. `safety.abuse_events`

```sql
CREATE TABLE safety.abuse_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(50) NOT NULL,
                    -- 'toxicity_flag' | 'spam_burst' | 'sybil_signal' | 'coordinated_attack'
                    -- | 'room_flood' | 'link_blocked' | 'false_report_pattern'
    alias           VARCHAR(20),
    hashed_ip       VARCHAR(128),                       -- for IP-level events only
    content_type    VARCHAR(20),
    content_id      UUID,
    severity        VARCHAR(10) NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
    details         JSONB,
    auto_actioned   BOOLEAN NOT NULL DEFAULT FALSE,
    action_taken    VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_abuse_alias ON safety.abuse_events(alias, created_at DESC)
    WHERE alias IS NOT NULL;
CREATE INDEX idx_abuse_created ON safety.abuse_events(created_at DESC);
```

**Retention:** 90 days. Scheduled purge job.

---

## 15. `jobs.retention_jobs`

Tracks scheduled deletion jobs for auditability and failure recovery.

```sql
CREATE TABLE jobs.retention_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        VARCHAR(30) NOT NULL,
                    -- 'delete_post' | 'delete_comment' | 'delete_room_message'
                    -- | 'delete_account' | 'purge_preserved_content' | 'purge_abuse_events'
    target_id       UUID NOT NULL,
    target_type     VARCHAR(20) NOT NULL,
    scheduled_at    TIMESTAMPTZ NOT NULL,               -- when job should run
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled',
                    -- 'scheduled' | 'running' | 'completed' | 'failed' | 'skipped'
    attempts        SMALLINT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    failure_reason  TEXT,
    skip_reason     TEXT                                -- e.g. 'retention_hold_active'
);

CREATE INDEX idx_jobs_scheduled ON jobs.retention_jobs(scheduled_at)
    WHERE status = 'scheduled';
CREATE INDEX idx_jobs_failed ON jobs.retention_jobs(status, last_attempt_at)
    WHERE status = 'failed';
```

---

## 16. Schema Relationship Summary

```
auth.auth_identities
    └── user_id → public.users.id

public.users
    └── alias (used in all content tables)

public.posts
    ├── alias (denormalized)
    ├── room_id → public.chat_rooms.id (nullable)
    └── ← public.comments.post_id

public.comments
    ├── alias (denormalized)
    ├── post_id → public.posts.id
    └── parent_id → public.comments.id (self-referential)

public.chat_rooms
    ├── creator_alias
    └── ← public.room_messages.room_id
    └── ← public.room_memberships.room_id

public.room_messages
    ├── room_id → public.chat_rooms.id
    └── alias (denormalized)

moderation.reports
    └── ← moderation.moderation_actions.report_id

moderation.moderation_actions
    └── ← moderation.appeals.action_id

moderation.audit_logs
    └── references action_id, report_id, appeal_id (soft references, not FK)

jobs.retention_jobs
    └── target_id (soft reference to any content entity)
```

---

## 17. Privacy Design Notes on Schema

1. **No `user_id` in content tables** — All content references `alias` only. Even with DB access, a post cannot be linked to an auth identity without the restricted `auth.auth_identities` table.

2. **Timestamps at minute precision** — Reduces timing-based correlation attacks. Exceptions: `moderation.audit_logs` uses full timestamp for accountability.

3. **Hashed IPs in safety schema only** — `hashed_ip` never appears in `public` schema tables. Rate limiting is purely Redis-based with no DB footprint.

4. **Alias as the identity boundary** — The alias is the maximum granularity of public identity. Everything above it (user_id → auth_identity → real person) is locked behind separate schemas and credentials.
