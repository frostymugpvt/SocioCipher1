# SocioCipher — Moderation & Safety System

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. Dual-Layer Moderation Philosophy

SocioCipher uses two complementary moderation layers that operate in parallel and escalate to each other:

```
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 1: COMMUNITY MODERATION                  │
│  Who: All authenticated users                                   │
│  Power: Vote to hide, flag, report                              │
│  Cannot: Remove permanently, suspend accounts                   │
│  Speed: Instant (crowd-sourced)                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ Escalates ↓
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 2: PLATFORM MODERATION                   │
│  Who: Trained platform moderators + automated pipeline          │
│  Power: Permanent removal, account suspension, legal referral   │
│  Cannot: Be bypassed for illegal content (mandatory action)     │
│  Speed: Tiered SLA (1h → 4h → 24h → 72h)                       │
└─────────────────────────────────────────────────────────────────┘
```

**Critical principle**: Neither layer alone is sufficient.
- Community moderation without platform authority = unenforceable against determined bad actors
- Platform moderation without community signals = overloaded, slow, and tone-deaf
- Together: Community surfaces problems quickly; platform resolves them with authority

---

## 2. Community Moderation

### 2.1 Hide Voting

| Rule | Value |
|------|-------|
| Who can vote | Any authenticated user |
| Votes are anonymous | Yes — not attributed to voter |
| Threshold to auto-hide | 15 hide votes |
| Reset condition | Moderator review clears votes |
| Author can see own content | Yes, even if community-hidden |
| UI for hidden content | Collapsed with "Hidden by community [Show]" |

**Anti-gaming protections:**
- Accounts < 1 day old: hide votes count at 0.25 weight
- Same alias can only cast 1 hide vote per content item
- If a user's hide votes are consistently invalidated by moderators, their voting weight is temporarily reduced
- Hide votes cannot be purchased, traded, or coordinated via in-platform tools

### 2.2 Reporting Flow

Any user can report any content. Reports are:
- Anonymous to the reported user
- Categorized (mandatory category selection)
- Optional context (200 char free text)
- Tracked per ticket ID for follow-up

Report categories and their automatic routing:

| Category | Auto-priority | Auto-action |
|----------|-------------|------------|
| Direct threat / violence | Critical (Tier 1) | Immediate human review |
| CSAM / Child exploitation | Critical (Tier 1) | Immediate lockdown + human review |
| Terrorism promotion | Critical (Tier 1) | Immediate human review |
| Doxxing | High (Tier 2) | Human review < 4h |
| Non-consensual intimate content | High (Tier 2) | Human review < 4h |
| Coordinated harassment | High (Tier 2) | Human review < 4h |
| Hate speech | Standard (Tier 3) | Human review < 24h |
| General harassment | Standard (Tier 3) | Human review < 24h |
| Impersonation | Standard (Tier 3) | Human review < 24h |
| Spam | Standard (Tier 3) | Auto-scan + human review < 24h |
| NSFW/explicit | Low (Tier 4) | Human review < 72h |
| Other | Low (Tier 4) | Human review < 72h |

### 2.3 Internal Trust Scores (Not Visible to Users)

Every account accumulates an internal trust score (0–100) based on:

| Signal | Effect |
|--------|--------|
| Account age (each day active) | +0.5 per day, capped at +30 |
| Report accuracy (report validated by mod) | +2 per validated report |
| Report false positive (report invalidated) | -3 per invalidated report |
| Content removed by moderator | -10 per removal |
| Account warning issued | -5 per warning |
| Successful appeal (action reversed) | +5 (partial recovery) |

**Trust score effects:**

| Score Range | Label | Effect |
|-------------|-------|--------|
| 80–100 | Trusted | 2x rate limits; votes weighted 1.5x |
| 50–79 | Standard | Default limits; votes weighted 1x |
| 20–49 | Reduced trust | 0.5x limits; votes weighted 0.5x; content pre-flagged |
| 0–19 | Low trust | Posts require 5 hide votes to surface; content pre-queued for review |

---

## 3. Platform (Operator) Moderation

### 3.1 Moderation Queue Structure

```
Incoming Reports
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                 AUTOMATED PRE-SCREEN                    │
│  - Duplicate report deduplication                       │
│  - Known-bad keyword/hash matching                      │
│  - Spam pattern detection                               │
│  - Photo DNA / CSAM hash matching (if images supported) │
│  - Priority classification based on report category     │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   Auto-actioned                 Human Queue
   (known violations)            (needs review)
   e.g., CSAM hash match         Tiered by priority
```

### 3.2 Human Review Queue — Tiers

**Tier 1 — Critical (SLA: < 1 hour)**
- CSAM / child exploitation
- Direct and specific threats to named individuals
- Terrorism incitement
- Active doxxing with real PII exposed
- Actions: Immediate content lockdown → human review → removal + escalation

**Tier 2 — High (SLA: < 4 hours)**
- Non-consensual intimate content
- Coordinated harassment campaigns
- Credible threats (less specific)
- Active fraud/phishing in progress
- Actions: Content flagged → human review → removal + potential account suspension

**Tier 3 — Standard (SLA: < 24 hours)**
- Hate speech claims
- Individual harassment
- Impersonation
- Spam and advertising
- Actions: Human review → warning or removal → notification to reporter and reported user

**Tier 4 — Low (SLA: < 72 hours)**
- Gray-area content
- Ambiguous NSFW
- Context-dependent speech
- Actions: Human review → judgment call → no action, warning, or removal

### 3.3 Moderation Actions Available

| Action | Description | Reversible? |
|--------|-------------|------------|
| No action | Report reviewed, content is lawful | N/A |
| Warning | Notification sent to author; content kept | Yes (via appeal) |
| Community hide override | Force content to community-hidden state | Yes |
| Content removal | Permanently remove content from platform | Yes via appeal |
| Account temporary suspension (24h–7d) | Account access blocked for period | Yes via appeal |
| Account permanent suspension | Alias deactivated, account blocked | Yes via appeal (rare reversal) |
| Emergency lockdown | Content removed and account frozen pending investigation | N/A |
| Legal referral | Report sent to law enforcement | No |

### 3.4 Escalation Path

```
Junior Moderator
│
├── Can: Warning, content removal, community hide override
├── Cannot: Account suspension, legal referral
│
└── Escalates to ↓

Senior Moderator
│
├── Can: All junior actions + account suspension (up to 7 days)
├── Cannot: Permanent suspension, legal referral
│
└── Escalates to ↓

Trust & Safety Lead
│
├── Can: All actions including permanent suspension and legal referral
├── Must: Approve all legal referrals
└── Must: Approve all CSAM-related actions
```

### 3.5 Audit Logging

Every moderation action creates an immutable audit log entry:

```json
{
  "audit_id": "AUD-uuid",
  "moderator_internal_id": "MOD-pseudonymous-id",
  "action_type": "content_removal",
  "content_type": "post",
  "content_id": "POST-uuid",
  "alias_affected": "ΔkR7•ψ2x",
  "reason_category": "harassment",
  "reason_notes": "Direct personal attack on named individual with repeated targeting",
  "timestamp": "2026-05-11T14:22:00Z",
  "report_ids": ["RPT-001", "RPT-002"],
  "appeal_filed": false,
  "appeal_outcome": null
}
```

Audit logs are:
- Immutable (append-only, no modification after creation)
- Retained for 2 years minimum
- Accessible only to senior moderators, trust & safety leads, and legal officers
- Subject to legal hold if litigation is anticipated

---

## 4. Appeals Process

### 4.1 Who Can Appeal
- Any user whose content was removed
- Any user whose account was suspended (temporarily or permanently)
- Reporter can appeal a "no action" outcome if they believe the review was wrong

### 4.2 Appeal Submission

```
Settings > Appeals > File Appeal

Required fields:
- Action being appealed (auto-populated from moderation notice)
- Reason for appeal:
  ○ Content did not violate policy
  ○ Context was not considered
  ○ Wrong content was removed (case of mistaken identity)
  ○ Policy was misapplied
  ○ Other
- Additional context (500 chars)
```

### 4.3 Appeal Review Rules
- Reviewed by a **different moderator** than who issued the original action
- Junior mod appeals reviewed by Senior mod
- Senior mod appeals reviewed by T&S Lead
- **No appeal** for: CSAM, terrorism, direct death threats (these are non-appealable)

### 4.4 Appeal Outcomes and Timelines

| Scenario | Timeline |
|----------|---------|
| Content removal appeal | 72 hours |
| Account suspension appeal (temporary) | 24 hours |
| Account suspension appeal (permanent) | 7 days |
| Reporter appeal of "no action" | 72 hours |

| Outcome | Result |
|---------|--------|
| Appeal upheld | Action reversed; content restored or account reinstated; trust score partial recovery |
| Appeal denied | Original action stands; user notified with explanation |
| Appeal partially upheld | Action modified (e.g., removal → warning) |

### 4.5 Repeat Appeals
- One appeal per moderation action
- If denied, no further appeal mechanism (users must accept the outcome)
- Exception: New material evidence can prompt a secondary review at T&S Lead discretion

---

## 5. Preservation Holds

When content may be needed for a safety investigation or legal proceeding:

```
Normal content lifecycle:
Post Created → [7 days] → Expired → Purged within 1 hour

Content with preservation hold:
Post Created → [7 days] → Expired (hidden from public) → [Hold active]
              → Hold closes → Purged within 24 hours
```

### 5.1 When Holds Are Applied
- Content is under active moderator investigation
- Content is referenced in an open legal request
- Content involves a Tier 1 incident (CSAM, terrorism, direct threats)
- Account is under active investigation

### 5.2 Preservation Hold Rules
- Hold is invisible to the content author (prevents evidence tampering)
- Preserved content is NOT shown publicly (it appears expired to all users)
- Preserved content is stored in a restricted, separately encrypted moderation store
- Preserved content cannot be used for any purpose other than safety review or legal compliance
- Holds are reviewed every 14 days and must be actively extended or closed

### 5.3 Hold Closure
- Investigation concludes: content purged within 24 hours
- Legal matter resolves: content purged unless legal hold still active
- Legal hold active: content retained until legal hold is lifted

---

## 6. Automated Abuse Detection Pipeline

### 6.1 Pre-Publish Checks (Synchronous, < 200ms)
- Rate limit check (Redis counter lookup)
- Spam signal check (duplicate content hash, posting burst)
- Known-bad keyword blocklist (exact match on CSAM, specific slurs used as attacks)
- Link safety check (known phishing/malware domains)
- Character pattern anomaly (excessive symbol spam, invisible character abuse)

### 6.2 Post-Publish Async Checks (< 5 seconds)
- NLP toxicity classifier (confidence score, not binary — flagged if > 0.85)
- Near-duplicate content detection (fuzzy hash comparison)
- Coordinated behavior detection (multiple posts from similar patterns at same time)
- New account high-velocity detection

### 6.3 Ongoing Pattern Detection (Background workers)
- Alias cluster analysis (multiple aliases with identical behavior patterns = potential Sybil attack)
- Report cluster analysis (multiple reports targeting same alias in short time = potential coordinated false-reporting campaign)
- Room flooding detection (single alias dominating a room message volume)

### 6.4 Automated Actions
| Detection | Automated Action |
|-----------|----------------|
| Known-bad keyword exact match | Block post, send to Tier 1 queue |
| Spam burst (> 5 posts in 5 min) | Exponential backoff, temporary slowdown |
| Toxicity score > 0.95 | Shadow-hold (not published until human review) |
| Toxicity score 0.85–0.95 | Published but immediately queued for review |
| Coordinated false-report pattern | Suppress reporter votes; flag to senior mod |
| Room flooding | Auto-mute alias in that room for 1 hour |
| Link to known phishing domain | Block post; notify author "link blocked" |

---

## 7. Emergency Response Protocol

For Tier 1 incidents (CSAM, terrorism, direct death threats):

```
Step 1: Content detected (automated or reported)
Step 2: Automated lockdown (content hidden immediately, not deleted)
Step 3: On-call moderator paged (SLA: 15 minutes to acknowledge)
Step 4: Human review confirms classification
Step 5: Permanent removal
Step 6: Account emergency suspension (immediate)
Step 7: Preservation hold applied to account data + relevant content
Step 8: T&S Lead notified within 1 hour
Step 9: Legal referral assessment (< 4 hours after confirmation)
Step 10: Law enforcement contact if legally required or warranted
Step 11: NCMEC CyberTipline report if CSAM confirmed (legally required in US)
Step 12: Incident report filed internally
Step 13: Post-incident review within 48 hours
```

---

## 8. What Moderation Does NOT Do

Moderation must NOT:
- Remove content simply because it is politically controversial
- Remove content because moderators personally disagree with the opinion expressed
- Apply heavier scrutiny to politically disfavored viewpoints
- Suppress criticism of public figures, institutions, governments, or corporations
- Remove dark humor, satire, or fiction that does not target specific individuals with abuse
- Take action based on false reports without independent verification
- Reveal the identity of reporters to reported users (or vice versa)
- Use moderation data for advertising or behavioral profiling

These prohibitions are enforced by:
- Mandatory documentation of reason for every action
- Senior mod review of all content removals (not just warnings)
- Regular audit of moderation decisions for bias patterns
- External appeals reviewer available for systemic complaints
