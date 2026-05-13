# SocioCipher — Realtime Behavior, Security Model & Deletion Engine

> **Version:** 1.0 | **Date:** 2026-05-11

---

# PART A — Realtime Behavior

## 1. WebSocket Connection Lifecycle

```
Client connects to wss://rt.sociocipher.io
        │
        ▼
[1] Handshake: client sends session token
        │
        ├── Token valid → connection accepted
        │   Server sends: { "event": "connected", "alias": "ΔkR7•ψ2x" }
        │
        └── Token invalid → connection rejected (4001 Unauthorized)
        │
        ▼
[2] Client subscribes to channels
        { "action": "subscribe", "channel": "room:770a0600-..." }
        { "action": "subscribe", "channel": "user:notifications" }
        │
        ▼
[3] Server pushes events in real time
        │
        ▼
[4] Client disconnects (tab close, network loss)
        └── Server removes from room presence set (Redis TTL cleanup)
```

---

## 2. Room Realtime Events

### New Message Received
```json
{
  "event": "room:message",
  "room_id": "770a0600-...",
  "message": {
    "message_id": "880b0700-...",
    "alias": "§3Φm≈9q",
    "content": "Has anyone read Dennett on this?",
    "reply_to_id": null,
    "created_at": "2026-05-11T19:00:00Z",
    "expires_at": "2026-05-18T19:00:00Z"
  }
}
```

**Client behavior:** Append to message list, scroll if user is at bottom.

---

### Message Expired While Viewing
```json
{
  "event": "room:message:expired",
  "room_id": "770a0600-...",
  "message_id": "880b0700-..."
}
```

**Client behavior:**
- Replace message content with: `"This message has expired"` (greyed out, non-clickable)
- If the user was composing a reply to this message: show banner `"The message you're replying to has expired"`, clear parent reference from composer

---

### Message Removed by Moderator
```json
{
  "event": "room:message:removed",
  "room_id": "770a0600-...",
  "message_id": "880b0700-...",
  "reason_public": "policy_violation"
}
```

**Client behavior:**
- Replace message content with: `"This message was removed by a moderator"`
- `reason_public` is a generic category — no specifics shown to room members

---

### Room Archived
```json
{
  "event": "room:archived",
  "room_id": "770a0600-...",
  "reason": "inactivity"
}
```

**Client behavior:**
- Show banner: `"This room has been archived due to inactivity. You can still read existing messages, but new messages are no longer allowed."`
- Disable message composer

---

## 3. Feed Realtime Events

### Post Expired While User Is Viewing Thread
```json
{
  "event": "post:expired",
  "post_id": "550e8400-..."
}
```

**Client behavior on thread page:**
- Replace post content with: `"This post has expired and has been deleted"`
- Collapse all comments with: `"Comments on this post are no longer available"`
- Show "Return to feed" button

**Client behavior on feed:**
- Smoothly fade and remove post card from feed (no jarring jump)

---

### Post Removed by Moderator (Author Only)
```json
{
  "event": "moderation:action",
  "target": "self",
  "action_type": "content_removal",
  "content_type": "post",
  "content_id": "550e8400-...",
  "reason_category": "harassment",
  "appeal_available": true,
  "appeal_deadline": "2026-05-25T19:00:00Z"
}
```

**Client behavior:**
- Show in-app notification: `"Your post was removed. Reason: Harassment. [Appeal]"`
- Post replaced with removal placeholder on any open thread

---

## 4. Notification Channel Events

### Inactivity Warning
```json
{
  "event": "account:inactivity_warning",
  "days_inactive": 17,
  "days_remaining": 3,
  "message": "Your account will be deleted in 3 days due to inactivity."
}
```

### Post Expiry Warning (24 hours before)
```json
{
  "event": "post:expiry_warning",
  "post_id": "550e8400-...",
  "expires_at": "2026-05-12T18:22:00Z",
  "content_snippet": "The thing nobody wants to admit..."
}
```

---

## 5. Expiry Broadcast Architecture

The deletion worker, when processing a content deletion, does the following:

```
Deletion Worker deletes post from DB
        │
        ▼
Worker publishes to Redis Pub/Sub:
  channel: "pub:expiry"
  payload: { type: "post", id: "550e8400-..." }
        │
        ▼
All Realtime Server instances subscribed to "pub:expiry"
        │
        ▼
Each Realtime Server checks: which connected clients have this post open?
  (tracked via in-memory subscription map: post_id → [socket_ids])
        │
        ▼
Emit "post:expired" event to relevant sockets
```

**Failure case:** If a client is not connected at expiry time, they will see an expired placeholder when they next load the content (server returns 410 Gone).

---

# PART B — Security Model

## 6. Threat Model and Mitigations

### 6.1 Spam and Bot Attacks

| Threat | Mitigation |
|--------|-----------|
| Bulk account creation via automation | OAuth requirement (no email/password registration); OAuth providers have their own bot detection |
| Posting bots | Rate limits per alias (Redis); burst detection (5 posts in 5 min = slowdown); toxicity scoring |
| Message flooding rooms | Per-alias per-room message rate limit (60/hour); room admin can mute alias |
| Duplicate content spam | SHA-256 content hash deduplication check before publish |
| Link spam | Per-post link count limit (max 2); known phishing domain blocklist |

---

### 6.2 Sybil Attacks (Multiple Fake Accounts)

Sybil attacks are when one entity creates many accounts to amplify influence (hide votes, false reports, coordinated posting).

**Mitigations:**
- New accounts start at trust score 50 with reduced vote weight (0.5x for first 24h)
- Hide vote threshold is absolute (15 votes), not percentage — harder to game with a few accounts
- Alias cluster detection: background worker checks for behavioral fingerprinting (same posting patterns, same timing, similar content) across accounts and flags clusters for review
- OAuth provider constraint: one provider account = one SocioCipher account (provider-level enforcement)
- False report pattern detection: if an alias cluster is submitting reports that are consistently invalidated, votes from that cluster are suppressed

---

### 6.3 Room Flooding

| Threat | Mitigation |
|--------|-----------|
| Single alias dominating a room | 60 messages/hour/room limit; room admin can mute |
| Coordinated flooding by multiple aliases | Room admin can remove members; platform mod can emergency-close room |
| Rapidly creating and flooding rooms | 3 rooms/day creation limit; room creation trust-gated (score < 20 = blocked) |

---

### 6.4 Scraping

| Threat | Mitigation |
|--------|-----------|
| Bulk content scraping for archival | Authentication required to read any content; no public API |
| Programmatic scraping via API | Rate limiting (100 requests/min per session); anomaly detection on high-volume read patterns |
| WebSocket scraping of rooms | Auth required; rate-limited connection attempts; suspicious subscription patterns flagged |
| Link preview scraping | No OpenGraph meta tags on individual post pages (privacy); landing page only |

---

### 6.5 Brute-Force Login Attempts

Not a direct concern (no password auth), but:
- OAuth PKCE flow enforced (prevents auth code interception)
- State parameter validation on OAuth callback (CSRF protection)
- Session tokens are short-lived (24h) with rolling refresh
- Suspicious login patterns (many OAuth attempts in short time) → Cloudflare WAF challenge

---

### 6.6 Automated Abuse (NLP Adversarial)

| Threat | Mitigation |
|--------|-----------|
| Unicode obfuscation (using lookalike chars to evade keyword filters) | Unicode normalization before keyword matching; pattern-based obfuscation detection |
| Leetspeak / character substitution | NLP classifier trained on adversarial examples; fuzzy match |
| Invisible/zero-width characters as evasion | Character whitelist on content input (reject or strip non-printable) |
| Coordinated context manipulation (abuse looks innocent in isolation) | Thread-level analysis; report cluster signals |

---

### 6.7 Suspicious Signup Bursts

```
Detection: > 10 new accounts authenticated within 5 minutes from behavioral pattern similarity
        │
        ▼
Automated response:
  - New accounts in burst: trust score = 20 (low trust)
  - All posts from burst accounts: pre-queued for review before publish (shadow-hold)
  - Burst flagged in safety.abuse_events for human review
        │
        ▼
Human review within 4 hours:
  - Legitimate burst (app launch, viral moment): restore normal trust
  - Coordinated Sybil: suspend all aliases in cluster
```

---

### 6.8 Malicious Links

```
Post submitted with URL
        │
        ▼
[1] Synchronous check: is domain in known phishing/malware blocklist?
    └── YES → Block post, notify: "Link blocked — known malicious domain"
        │
        ▼
[2] Async check: safe browsing API lookup (Google Safe Browsing or VirusTotal)
    └── Unsafe → Remove post retroactively, notify author
        │
        ▼
[3] Link display: URLs are displayed as plain text (no auto-link in Phase 1)
    Users must copy-paste — reduces click-through on phishing links
```

---

### 6.9 Account Trust Tiers

| Tier | Score | Signup Constraints | Post Behavior | Vote Weight |
|------|-------|-------------------|---------------|------------|
| New | 50 (day 0) | OAuth required | Normal publish, async scored | 0.5x for 24h |
| Standard | 50–79 | None | Normal | 1x |
| Trusted | 80–100 | None | Normal | 1.5x |
| Reduced | 20–49 | None | Pre-flagged for review; slower rate limits | 0.5x |
| Low | 0–19 | None | Shadow-hold on all posts (queued before publish) | 0.25x |

---

### 6.10 CAPTCHA Policy

CAPTCHAs are used **only when necessary** to avoid UX degradation:

| Trigger | CAPTCHA Type |
|---------|-------------|
| OAuth login from known bot ASN | Cloudflare Turnstile (invisible, frictionless) |
| > 3 failed OAuth attempts in 10 min | Cloudflare Turnstile |
| API requests from suspected automation | Cloudflare Turnstile on next web request |
| Account trust score drops to 0 | Manual CAPTCHA on next action |

We do NOT use CAPTCHAs on normal account creation or posting flows.

---

# PART C — Retention and Deletion Engine

## 7. Retention Rules Engine

### Rule 1: Delete Standard Posts After 7 Days
```
Trigger: Cron job every hour (pg_cron or BullMQ delayed job)
Query: SELECT id FROM posts WHERE expires_at <= NOW() 
       AND status != 'preserved' AND retention_hold = FALSE
Action: 
  1. Set status = 'expired' (immediate — hides from all queries)
  2. Enqueue delete-post job with 1-hour delay
  3. Emit post:expired realtime event
  4. Deindex from OpenSearch
  5. Cascade: mark all child comments as expired
After 1-hour delay:
  6. Hard DELETE from posts table
  7. Hard DELETE from comments table (cascade)
  8. Mark retention_job as completed
```

### Rule 2: Delete Inactive Accounts After 20 Days
```
Trigger: Cron job every 6 hours
Query: SELECT id FROM users WHERE last_active_at <= NOW() - INTERVAL '20 days'
       AND account_status = 'active'
       AND is_under_investigation = FALSE
       AND deletion_scheduled_at IS NULL
Action:
  1. Set deletion_scheduled_at = NOW() + INTERVAL '24 hours'
  2. Send inactivity deletion warning notification
After 24 hours:
  3. Delete all posts/comments/messages by this alias (not under hold)
  4. Delete room_memberships
  5. Delete user_blocks, muted_entities
  6. Delete public.users record
  7. Delete auth.auth_identities record
  8. Insert tombstone record (alias + deletion timestamp, retained 30 days for re-creation prevention)
  9. Mark retention_job as completed
```

### Rule 3: Preserve Content Under Active Report
```
Trigger: Report submitted for content
Action: SET retention_hold = TRUE on content record
Effect: Deletion jobs skip this content (WHERE retention_hold = FALSE)
Content is hidden from public (status unchanged but retention_hold = TRUE acts as override)
```

### Rule 4: Purge Preserved Content After Investigation Closes
```
Trigger: Moderator closes investigation (sets report status to resolved_*)
Action:
  1. SET retention_hold = FALSE on content record
  2. Content is already past its natural expiry → immediately eligible for deletion
  3. Purge job runs within 24 hours
  4. Content permanently deleted from DB and restricted moderation store
```

### Rule 5: Purge Abuse Events After 90 Days
```
Trigger: Cron job daily
Query: SELECT id FROM safety.abuse_events WHERE created_at <= NOW() - INTERVAL '90 days'
Action: Hard DELETE
```

---

## 8. Deletion Job Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    DELETION SCHEDULER                     │
│  pg_cron (runs inside PostgreSQL):                        │
│  - Every hour: find expired content → insert BullMQ jobs  │
│  - Every 6 hours: find inactive accounts → insert jobs    │
│  - Every day: find expired abuse events → insert jobs     │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│                   BULLMQ DELETION QUEUE                   │
│  Jobs:                                                    │
│  - { type: 'delete_post', id: uuid, delay: 3600s }       │
│  - { type: 'delete_account', id: uuid, delay: 86400s }   │
│  - { type: 'purge_abuse_events', batch_size: 1000 }      │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────┐
│                   DELETION WORKER                         │
│  Processes: 5 concurrent workers                          │
│  On success: marks jobs.retention_jobs as 'completed'     │
│  On failure: retry up to 3 times (exponential backoff)    │
│  After 3 failures: mark as 'failed', alert on-call        │
│  Emits: realtime expiry events via Redis Pub/Sub          │
└───────────────────────────────────────────────────────────┘
```

---

## 9. Edge Cases and Failure Recovery

| Edge Case | Handling |
|-----------|---------|
| Deletion job fails (DB timeout) | Retry up to 3 times with exponential backoff; alert if all fail |
| Content expires during active session | Realtime `post:expired` event sent; 410 returned on next REST call |
| Account deleted while content is in a preservation hold | Account record deleted; content retained separately under hold; alias becomes `[deleted user]` |
| Deletion job runs but content has a new report (race condition) | Worker checks `retention_hold` before DELETE; if TRUE, skip and log as 'skipped' |
| DB primary failover during deletion batch | Jobs remain in BullMQ queue; worker reconnects and retries on new primary |
| Timezone/clock skew between app servers | All timestamps stored in UTC; expires_at calculated at write time; no client-side expiry calculation |
| User submits new post exactly at rate limit boundary | Redis INCR is atomic; boundary handled correctly; last request gets 429 |
| Mass deletion event (viral post with many comments) | Batched deletion (1000 rows at a time); no single transaction deletes > 1000 rows |
| Legal hold placed AFTER 7-day expiry | If content already purged: log that no content exists to hold; notify legal team; if not yet purged (within 1-hour window): apply hold immediately |

---

## 10. User Notifications for Deletion Events

| Event | Notification Channel | Message |
|-------|-------------------|---------|
| Post expires in 24 hours | In-app (next page load) + push | "Your post expires in 24 hours" |
| Post expired | In-app notification center | "Your post from [date] has been deleted" |
| Account inactivity (day 17) | In-app (next login) + email (if available) | "Log in to prevent account deletion in 3 days" |
| Account deleted | N/A (account gone) | Email to OAuth provider email (last resort) |
| Content removed by moderator | In-app push | "Your [post/comment] was removed. Reason: [X]. [Appeal]" |
| Preservation hold ending (content purged) | None (privacy — would expose investigation) | N/A |
