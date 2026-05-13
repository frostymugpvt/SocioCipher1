# SocioCipher — Core Features Specification

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. Account Creation and Onboarding

### 1.1 Auth Provider Integration
- Sign-in via OAuth 2.0 providers: Google, Apple, GitHub (no password stored by platform)
- The platform receives only an OAuth sub-token — **not** the user's email, name, or profile picture from the provider
- The sub-token is hashed before storage; the platform never stores the raw provider ID in plain text
- One auth provider account maps to exactly one SocioCipher account

### 1.2 Alias Generation
- On first login, the system auto-generates a **public alias** — a non-pronounceable, non-meaningful string
- Alias construction rules:
  - Length: 6–10 characters
  - Character pool: Latin letters (upper + lower), digits, Unicode symbols (Greek, mathematical, currency), and punctuation
  - Examples: `ΔkR7•ψ2x`, `§3Φm≈9q`, `λ7∞Gπ4`
  - Must NOT be a real word in any major language (checked against a blocklist)
  - Must NOT be offensive in any phonetic reading (checked against a symbol+phoneme abuse list)
- Alias is permanent and cannot be changed by the user
- Alias is displayed as the sole identifier in all public contexts

### 1.3 Onboarding Flow
1. Landing page → "Get Started" → OAuth provider selection
2. OAuth redirect and callback
3. First-time: Alias reveal screen ("Your identity is: `ΔkR7•ψ2x`")
4. Mandatory privacy and terms consent (must scroll, checkbox required)
5. Brief platform explainer: ephemeral content, no profiles, community rules
6. Optional: Join a room or post your first thought
7. Returning user: Skip to home feed directly

### 1.4 No-Profile Identity Model
- There is **no profile page** visible to other users
- No editable username, bio, profile picture, or display name
- No follower/following infrastructure
- No post history visible to others (a user's previous posts are not linkable by other users)
- The alias appears next to each post/comment but clicking it does nothing (no profile drill-down)
- The only "identity" a user has is their alias, and the alias reveals nothing

---

## 2. Posting System

### 2.1 Short Posts (Feed Posts)
- Maximum 500 characters (Twitter-length, with room for nuance)
- Supports plain text only (Phase 1); image attachments considered Phase 2+
- Posts appear in the public feed in reverse-chronological order
- No algorithm-based ranking in Phase 1 (pure chronological)
- Each post displays: alias, timestamp, character count, comment count, report button, hide vote button
- No like/upvote count displayed (reduces performative behavior)
- No repost/share mechanism (reduces viral amplification of abuse)
- Ephemeral timer: visible countdown showing "Expires in X days Y hours"

### 2.2 Post Visibility States
| State | Visible to Public | Visible to Author | Visible to Moderator |
|-------|:----------------:|:-----------------:|:-------------------:|
| Active | ✅ | ✅ | ✅ |
| Community-hidden (vote threshold) | ❌ (blurred/collapsed) | ✅ | ✅ |
| Reported (under review) | ✅ (unless also hidden) | ✅ | ✅ |
| Moderator-removed | ❌ | ❌ (notified) | ✅ (audit log) |
| Expired (7 days) | ❌ | ❌ | ❌ (purged) |
| Preserved (under investigation) | ❌ (not shown publicly) | ❌ | ✅ |

### 2.3 Feed Types
- **Global Feed**: All recent posts across the platform (chronological)
- **Room Feed**: Posts and messages within a specific room
- **Trending Topics**: Hashtag/keyword clusters (no personalization, no user tracking)

---

## 3. Comments and Reply Threads

### 3.1 Comment System
- Any authenticated user can comment on any post
- Comments displayed below posts in a collapsible thread
- First-level comments (direct replies to the post): up to 500 characters
- Each comment shows: alias, timestamp, expiry timer, reply count, report button, hide vote button

### 3.2 Nested Reply Threads
- Comments support deep nesting (replies to replies)
- Maximum nesting depth: 10 levels (prevents infinite thread inflation)
- Each nesting level is visually indented
- Collapsed by default beyond depth 3 (user must expand)
- Reply character limit: 500 characters at any depth
- A deep reply shows its parent context (first 80 characters of parent) for readability

### 3.3 Thread Expiry Behavior
- All comments and replies in a thread expire when the parent post expires (7 days from post creation)
- Comments cannot outlive their parent post
- If a parent post is moderation-removed, all comments are also removed
- If a parent post is preserved under investigation, comments are also preserved

---

## 4. Chat Rooms

### 4.1 Room Types
| Type | Creation | Visibility | Join Method |
|------|---------|-----------|------------|
| **Public Room** | Any user | Listed in room directory | Open join |
| **Unlisted Room** | Any user | Not listed (link-only) | Link share |
| **Moderated Room** | Platform staff | Listed | Open join, elevated moderation |

### 4.2 Room Features
- Room has a name (max 50 chars), topic description (max 200 chars)
- Room creator gets "room admin" status within that room
- Room admin can: pin messages, mute members (for up to 24h), remove members, close room
- No persistent member lists visible to other users (privacy)
- Real-time messaging via WebSockets
- Messages displayed with alias + timestamp
- Message history: last 200 messages visible to new joiners (older messages not accessible)
- Room auto-archives if no messages for 48 hours (no new messages allowed, existing messages readable for their expiry window)

### 4.3 Room Message Expiry
- Individual messages in rooms expire after 7 days from send time
- Expired messages are removed from view and storage
- "This message has expired" placeholder shown if a user is replying to a message that just expired during a session

### 4.4 Room Membership and Privacy
- Joining a room does not create a publicly visible membership record
- Room membership table exists server-side only for authorization and moderation purposes
- Leaving a room is instantaneous and permanent (no "was a member" history shown)
- Users can be in multiple rooms simultaneously

---

## 5. Search and Discovery

### 5.1 Content Search
- Full-text search over active (non-expired) post content
- Search returns: post snippets, room names, topic hashtags
- Search does NOT return: user aliases (you cannot search for a user), post authors
- Search results are not personalized — same results for all users

### 5.2 Room Discovery
- Room directory: listed public rooms sorted by recent activity
- Room names and topic descriptions are searchable
- Room member count is NOT shown (avoids popularity bias)
- Trending topics section (keyword clusters from recent posts, no user data attached)

### 5.3 Hashtags / Topics
- Users can include `#topic` tags in posts (max 3 per post)
- Tags are discoverable in search and trending
- Tags do NOT create user-to-tag relationship tracking
- Tags cannot contain personal information (validated at post-save time)

---

## 6. Reporting and Appeals

### 6.1 Reporting Flow
- Every post, comment, reply, and room message has a "Report" button
- Report categories: Harassment, Threats, Illegal content, Doxxing, Spam, NSFW/explicit, Impersonation, Hate speech, Other
- Reporter is anonymous (report is not attributed to the reporter's alias in any public way)
- Reporter receives a ticket ID for appeal/follow-up
- Reported content is flagged in moderation queue immediately

### 6.2 Report Outcomes
| Outcome | Trigger | Action |
|---------|---------|--------|
| No action | Report reviewed, content lawful | Content stays, report closed |
| Community-hidden | Community vote threshold reached | Content collapsed for other users |
| Moderator warning | First-time minor violation | Content kept, user notified |
| Moderator removal | Confirmed violation | Content removed, user notified |
| Account suspension | Repeated or severe violations | Account suspended (alias deactivated) |
| Emergency removal | Illegal content, CSAM, direct threat | Immediate removal, law enforcement referral if required |

### 6.3 Appeals
- Users can appeal a moderation action within 14 days
- Appeals submitted via a form (no identity revealed, uses account session)
- Appeals reviewed by a different moderator than who made the original decision
- Appeal outcomes: Upheld (action reversed), Denied (action stands), Partially modified
- Users notified of appeal outcome within 72 hours (standard) or 24 hours (if account suspended)

---

## 7. Content Expiry

### 7.1 Standard Expiry
- All posts, comments, and room messages expire exactly 7 days after creation
- Expiry is displayed as a live countdown timer in the UI
- At expiry, content is immediately hidden from public view
- Background deletion job permanently removes the content from the database within 1 hour of expiry
- No "archive" or "cache" is kept for expired content unless a preservation hold is active

### 7.2 Preservation Hold
- Content under an active report investigation is NOT deleted at 7 days
- A `retention_hold` flag is set on the content record
- Content is hidden from public view but retained in a restricted moderation-access store
- Once the investigation closes, preserved content is purged within 24 hours
- Users are NOT informed that their content is under a preservation hold (would tip off bad actors)

### 7.3 User Notification
- 24 hours before expiry: in-app notification ("Your post expires in 24 hours")
- At expiry: in-app notification ("Your post from [date] has expired and been deleted")
- If content is removed by moderation: notification with reason category and appeal instructions
- If account is at risk of deletion: email via auth provider (if available) 7 days before deletion

---

## 8. Account Expiry

### 8.1 Inactive Account Deletion
- Account is considered inactive if no login for 20 consecutive days
- At day 17: warning notification sent (in-app on next login attempt + email if available)
- At day 20: account marked for deletion
- Deletion job runs within 24 hours of day 20 mark
- Deletion removes: auth_identity mapping, alias, all posts/comments/messages authored by the user (not under preservation hold)
- Content under active investigation (preservation hold) is retained separately from account data

### 8.2 Exceptions to Account Deletion
- Account is under active investigation: deletion deferred until investigation closes
- Account has unresolved legal hold: deletion deferred
- Account has an active appeal: deletion deferred until appeal resolves

### 8.3 Voluntary Account Deletion
- Users can request account deletion at any time from settings
- Same purge process as inactive deletion
- Confirmation required (two-step: "Delete account" → confirm → done)
- Data is purged within 24 hours of confirmed deletion request
- Users receive a final confirmation that deletion is complete

---

## 9. Community Moderation

### 9.1 Hide Voting
- Any authenticated user can cast a "hide vote" on any post/comment
- Hide votes are anonymous (not attributed to the voter)
- Threshold: 15 hide votes → content is automatically community-hidden (collapsed with "Content hidden by community" label)
- Hidden content is still visible to the author and platform moderators
- Community-hidden content is queued for moderator review within 24 hours

### 9.2 Reputation Signals (Internal Only)
- The platform maintains internal trust scores for accounts (not visible to users or other users)
- Trust score factors: account age, report rate (how often their content is reported), report accuracy (how often their reports are validated)
- High-trust accounts: slight boost in content visibility ranking (future phase)
- Low-trust accounts: posts may require more hide votes to surface, or are pre-flagged for review

### 9.3 Limitations of Community Moderation
- Community moderation alone cannot remove content — only hide it
- Only platform moderators can permanently remove content
- Community moderation cannot suspend or delete accounts

---

## 10. Platform (Operator) Moderation

### 10.1 Moderation Authority
- Platform moderators have absolute authority to:
  - Remove any content regardless of community voting
  - Suspend or terminate any account
  - Override appeals in cases of illegal content
  - Issue emergency takedowns (no review delay for CSAM, direct threats, terrorism)

### 10.2 Moderation Queue
- Reports flow into a tiered queue:
  - **Tier 1 (Critical):** CSAM, direct violence threats, terrorism → SLA: immediate (< 1 hour)
  - **Tier 2 (High):** Doxxing, non-consensual intimate content, coordinated harassment → SLA: < 4 hours
  - **Tier 3 (Standard):** Harassment, hate speech, spam, impersonation → SLA: < 24 hours
  - **Tier 4 (Low):** Minor policy questions, gray-area content → SLA: < 72 hours

### 10.3 Audit Logging
- Every moderation action is logged: moderator ID, timestamp, content ID, action taken, reason, appeal status
- Audit logs are retained for 2 years (legal compliance)
- Audit logs are not public but are available to legal/compliance officers

### 10.4 Moderator Protections
- Moderators operate under pseudonymous internal IDs (not their real names in the UI)
- Moderator identities are not exposed to users at any point
- Escalation path: Junior Mod → Senior Mod → Legal/Trust & Safety Lead

---

## 11. Rate Limits and Spam Controls

### 11.1 Standard Rate Limits (Per User)
| Action | Limit |
|--------|-------|
| Post creation | 10 per hour |
| Comment creation | 30 per hour |
| Room message | 60 per hour per room |
| Report submission | 20 per day |
| Hide vote | 50 per day |
| Room creation | 3 per day |
| Room join | 20 per day |
| Search queries | 100 per hour |

### 11.2 Elevated Limits (Trusted Accounts)
Accounts with high trust score get 2x the standard limits after 7 days of activity.

### 11.3 Spam Signals
- Identical or near-identical content posted multiple times → auto-flagged
- Rapid posting bursts (> 5 posts in 5 minutes) → temporary slowdown (exponential backoff)
- Link-heavy posts (> 2 external links) → flagged for review
- New accounts posting > 5 posts in first hour → flagged

---

## 12. User Safety Controls

### 12.1 Block
- Block an alias: their posts/comments are no longer visible to you
- They cannot see your posts or comments either (mutual blind)
- They cannot join rooms you created
- Block list is private and stored server-side
- Block does not notify the blocked user

### 12.2 Mute
- Mute an alias: their content is hidden from your feed but they can see yours
- Mute a room: room messages hidden from your feed (you remain a member but silent)
- Mute a topic/hashtag: posts with that tag hidden from your view
- All mute actions are reversible and private

### 12.3 Hide
- Hide a specific post/comment from your own view (doesn't affect others)
- Distinct from "report" — hiding is personal preference, not a content action

### 12.4 Report
- Report submits content for platform review (described in Section 6)
- Report is always anonymous to the reported user

### 12.5 Room Exit
- Any user can leave a room at any time
- Leaving is permanent (no record shown to other room members)
- Room creator can exit but must transfer admin rights first OR room becomes unmoderated

---

## 13. Sensitive Topic Handling

### 13.1 Sensitive Room Tags
- Rooms and posts can be tagged as "Sensitive Topic" by the creator
- Tagged content requires an additional click/acknowledgment to view ("This discussion contains sensitive content — continue?")
- Sensitive tags: Mental Health, Substance Use, Political Extremism Discussion, Explicit Language, Trauma Topics

### 13.2 Crisis Intervention
- Posts containing specific crisis keywords (suicide ideation, self-harm) trigger:
  - Automatic prepending of crisis resource links (not removal)
  - Flagging for priority human review
  - No automatic deletion (people discussing crisis need support, not censorship)

### 13.3 Controversial but Lawful Speech
- Political criticism, religious debate, satire, dark humor, and controversial opinions are **allowed**
- Heated disagreement is **allowed**; targeted personal harassment is **not**
- The distinction is: criticizing an *idea* or *public figure's actions* is protected; targeting an *individual* with repeated abuse is not
