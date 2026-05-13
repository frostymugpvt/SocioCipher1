# SocioCipher — Privacy Architecture

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. Privacy-by-Design Principles Applied

SocioCipher applies all 7 foundational principles of Privacy by Design (Ann Cavoukian):

| Principle | Application |
|-----------|-------------|
| **Proactive, not reactive** | Privacy controls baked into architecture before build, not bolted on |
| **Privacy as the default** | Data minimization is the default; collection is the exception |
| **Privacy embedded into design** | Auth token hashing, alias separation, and expiry are structural — not optional |
| **Full functionality** | Privacy doesn't degrade usability; pseudonymous operation is full-featured |
| **End-to-end security** | Data encrypted at rest and in transit; access controls enforced |
| **Visibility and transparency** | Clear policy on what is/isn't collected, published and enforced |
| **Respect for user privacy** | User data rights: access, correction, deletion — all honored |

---

## 2. Data Collection — What We Collect

### 2.1 Minimal Required Data

| Data Field | Why Collected | Stored As | Retention |
|-----------|--------------|----------|-----------|
| OAuth provider sub-token | Authenticate the user | HMAC-SHA256 hash | Lifetime of account |
| Auth provider name | Know which provider to redirect to | Enum (google/apple/github) | Lifetime of account |
| Generated alias | Public identity | Plaintext (it's meant to be public) | Lifetime of account |
| Account creation timestamp | Inactivity deletion calculation | UTC timestamp | Lifetime of account |
| Last login timestamp | Inactivity deletion calculation | UTC timestamp | Lifetime of account |
| Post content | Platform function | Plaintext in DB | 7 days from creation |
| Comment/reply content | Platform function | Plaintext in DB | 7 days from parent post |
| Room message content | Platform function | Plaintext in DB | 7 days from send |
| Room metadata (name, description) | Platform function | Plaintext in DB | Until room deleted |
| Report submissions | Safety and legal | Pseudonymized (alias, not auth identity) | 2 years |
| Moderation actions | Safety, legal, audit | Pseudonymized (alias-based) | 2 years |
| Abuse events | Safety, pattern detection | Hashed identifiers | 90 days |
| Session tokens | Auth continuity | Server-side; not stored in DB long-term | 24-hour rolling expiry |

### 2.2 Temporary Rate-Limiting Data

| Data Field | Why Collected | Stored As | Retention |
|-----------|--------------|----------|-----------|
| IP address (hashed) | Rate limiting, spam detection | HMAC hash of IP | 24 hours (rolling) |
| Request frequency count | Rate limit enforcement | Counter in Redis | TTL: 1 hour |
| Device fingerprint (coarse) | Sybil/bot detection | Hashed, coarse buckets | 7 days max |

> **Note:** IP addresses are hashed before any storage. Raw IP addresses are never written to disk or logs. The hash is used only for rate-limit counters.

---

## 3. Data NOT Collected — Explicit Exclusions

| Data Category | Why Not Collected |
|--------------|------------------|
| User email address | Not received from OAuth; not requested |
| User real name | Not received from OAuth; not requested |
| Profile photo | Not received from OAuth; not requested |
| Location data (GPS, city, country) | Not collected; no location features |
| Browsing history / page view tracking | No analytics SDK embedded; no page tracking |
| Social graph | No followers, following, or connection tracking |
| Read receipts | We don't track who read what |
| Search query history | Queries are not stored against user identity |
| Engagement analytics per user | No "user X liked Y, viewed Z" data |
| Device identifiers (IDFA, GAID) | Not collected; no mobile SDK with device ID |
| Cross-site tracking | No third-party tracking pixels, no ad networks |
| Behavioral profiles | No profiling, no ad targeting data |

---

## 4. Data Visibility Matrix

| Data | Visible to User | Visible to Other Users | Visible to Moderators | Visible to Law Enforcement (valid process) |
|------|:--------------:|:---------------------:|:-------------------:|:-----------------------------------------:|
| Auth identity (hashed token) | ❌ | ❌ | ✅ (emergency only) | ✅ (valid legal process) |
| Public alias | ✅ | ✅ | ✅ | ✅ |
| Post content (active) | ✅ | ✅ | ✅ | ✅ |
| Post content (expired) | ❌ | ❌ | ❌ (purged) | ❌ (purged, unless preservation hold) |
| Post content (preservation hold) | ❌ | ❌ | ✅ | ✅ |
| Report history | ✅ (own reports) | ❌ | ✅ | ✅ |
| Moderation actions against user | ✅ (own only) | ❌ | ✅ | ✅ |
| Block/mute list | ✅ (own only) | ❌ | ❌ | ❌ |
| Session tokens | ❌ | ❌ | ❌ | ❌ |
| Hashed IP (rate limiting) | ❌ | ❌ | ❌ | ❌ (not retained long enough) |
| Abuse event logs | ❌ | ❌ | ✅ | ✅ |
| Trust score | ❌ (internal only) | ❌ | ✅ | ❌ |

---

## 5. Data Retention Table

| Data Category | Retention Period | Deletion Trigger | Preservation Exception |
|--------------|-----------------|-----------------|----------------------|
| Auth identity mapping | Account lifetime | Account deletion or 20-day inactivity | Active investigation |
| Public alias | Account lifetime | Account deletion | Active investigation |
| Account metadata (timestamps) | Account lifetime | Account deletion | Active investigation |
| Post content | 7 days from creation | Scheduled job | Active report/investigation hold |
| Comment content | 7 days from parent post | Scheduled job (cascaded) | Active report/investigation hold |
| Room messages | 7 days from send | Scheduled job | Active report/investigation hold |
| Room metadata | Until room deleted or 90-day inactivity | Room archival job | N/A |
| Session tokens | 24 hours (rolling) | Session expiry | N/A |
| Hashed IP (rate limiting) | 24–72 hours (Redis TTL) | Automatic Redis expiry | N/A |
| Report records | 2 years | Manual legal review | Legal hold |
| Moderation action logs | 2 years | Manual legal review | Legal hold |
| Abuse event logs | 90 days | Scheduled job | Active investigation |
| Preserved content (under hold) | Until investigation closes + 24h | Hold closure + purge job | N/A |
| Appeal records | 2 years | Manual legal review | N/A |
| Deleted account tombstone | 30 days (re-creation prevention) | Tombstone expiry job | N/A |

---

## 6. Auth Identity Separation Architecture

The most critical privacy mechanism is **total separation between auth identity and public identity**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL LAYER                             │
│  OAuth Provider (Google/Apple/GitHub)                           │
│  Knows: real email, real name, profile photo                    │
│  Sends to us: only `sub` token (opaque user ID)                │
└────────────────────┬────────────────────────────────────────────┘
                     │ sub token
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GATEWAY LAYER                              │
│  Immediately HMAC-SHA256 hash the sub token                     │
│  raw_sub is NEVER stored                                        │
│  hashed_sub is the auth identity stored in auth_identities table│
└────────────────────┬────────────────────────────────────────────┘
                     │ hashed_sub
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INTERNAL MAPPING LAYER                        │
│  auth_identities table:                                         │
│    hashed_sub → internal user_id (UUID)                         │
│  This table is the ONLY place where auth identity links to user │
│  This table has strict access controls (requires elevated access)│
└────────────────────┬────────────────────────────────────────────┘
                     │ user_id (UUID)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC IDENTITY LAYER                        │
│  public_aliases table:                                          │
│    user_id → alias (ΔkR7•ψ2x)                                  │
│  All posts, comments, messages reference: alias only            │
│  user_id is NEVER in any public-facing query                    │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Matters

- Content tables (posts, comments, messages) reference **alias**, not user_id
- This means: even with full database access, you cannot link a post to an auth identity without going through the auth_identities table
- The auth_identities table requires a separate, audited access credential
- In legal processes, law enforcement must specify the alias and receive only what the platform is legally required to disclose

---

## 7. Metadata Minimization

### Timestamp Precision
- Timestamps are stored at **minute precision**, not second or millisecond
- This reduces timing-based correlation attacks (you can't correlate a post to a login event to the minute)
- Exception: moderation audit logs use full timestamp for accountability

### IP Address Handling
- Raw IP is NEVER logged or stored
- On receipt of a request: IP is immediately hashed with a rotating daily salt
- The hash is used only as a counter key in Redis for rate limiting
- After 24–72 hours, the Redis key expires and the hash is gone
- No IP-based user profiles. No IP-based history.

### User Agent Handling
- User agent strings are NOT stored in logs
- A coarse "platform category" (browser/mobile/API) is inferred and stored as an enum only for security heuristics
- Full UA strings are discarded after the request lifecycle

### Content Metadata
- Posts store: alias, content, created_at (minute precision), expires_at, room_id (if applicable)
- Posts do NOT store: IP, device, location, session ID, user_id, or any user-linkable field beyond alias

### Search Queries
- Search queries are executed and discarded
- No search history per user
- No search query logging for analytics

---

## 8. Encryption Strategy

### Data at Rest
- PostgreSQL database: AES-256 encryption at the storage layer (disk-level encryption)
- Redis: no sensitive data stored in Redis (only rate-limit counters and ephemeral session data)
- Moderation content store (preservation hold contents): additionally encrypted at the application layer with a key rotation cycle of 90 days

### Data in Transit
- All client-server communication: TLS 1.3 minimum
- Internal service-to-service communication: mTLS
- WebSocket connections: WSS (WebSocket Secure) enforced, no fallback to WS

### Key Management
- Keys managed via a dedicated secrets manager (e.g., HashiCorp Vault or AWS Secrets Manager)
- HMAC keys for auth token hashing: rotated quarterly
- Application-layer encryption keys: rotated every 90 days with re-encryption of stored data
- Key access is audited: every access to a key is logged

---

## 9. Third-Party Data Sharing Policy

| Scenario | Shared? | Conditions |
|----------|---------|-----------|
| Advertising networks | ❌ Never | No ad business model |
| Analytics providers | ❌ Never | No third-party analytics |
| Data brokers | ❌ Never | Prohibited by policy and architecture |
| Law enforcement | ✅ With conditions | Valid legal process only (court order, subpoena); minimum necessary data only; legal team review required |
| Safety partners (e.g., NCMEC for CSAM) | ✅ Required by law | CSAM hash reporting is legally mandated in most jurisdictions |
| Cloud infrastructure providers | ✅ Processors only | Under strict DPA; no ability to access plaintext content for their own purposes |

---

## 10. User Data Rights

| Right | Mechanism | Timeline |
|-------|-----------|---------|
| Right to access own data | Settings > Export my data (alias, posts, reports) | Provided within 30 days |
| Right to deletion | Settings > Delete Account | Completed within 24 hours |
| Right to correction | No correction mechanism (aliases are system-generated; content expires) | N/A (ephemeral by design) |
| Right to data portability | Data export in JSON format | Provided within 30 days |
| Right to object to processing | Account deletion is the primary mechanism | Immediate |
| Right to restrict processing | Raise concern via abuse@[platform].com | Reviewed within 7 days |

---

## 11. Privacy Threat Model

| Threat | Mitigation |
|--------|-----------|
| Auth provider leaks user identity to platform | OAuth scoped to sub-only; email/name never requested |
| Database breach reveals real identities | auth_identities table is isolated; posts reference alias only |
| Traffic analysis reveals user posts | HTTPS enforced; timing metadata minimized |
| Operator snooping on users | Auth identity access is audited; separation by design |
| Law enforcement fishing expedition | Strict legal review; minimum necessary disclosure policy |
| Alias correlation over time builds a profile | Aliases are non-customizable, non-meaningful; post history not aggregated publicly |
| Metadata correlation (timing, device) | Coarse timestamps; no device ID storage; no behavioral logging |
| Re-identification via content analysis | Ephemerality limits available content; no persistent archives |
