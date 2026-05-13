# SocioCipher — User Flow & UX Design

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. First Visit Flow (Unauthenticated)

```
Landing Page
│
├── Hero: "Say what you actually think."
│   Subtext: "No profile. No identity. No permanent record."
│
├── [Preview of anonymized feed — read-only, no login required]
│
├── CTA: "Join the Conversation" → Auth Selection Screen
│
└── Footer: Privacy Policy | Content Policy | Moderation | Terms
```

### Landing Page Elements
- Animated alias generator preview ("Your alias might look like: `ΔkR7•ψ2x`")
- Ephemeral counter demo ("This message disappears in 7 days")
- No screenshots of real user content (privacy)
- Dark theme default, light theme toggle

---

## 2. Account Creation Flow

```
Auth Selection Screen
│
├── "Sign in with Google"
├── "Sign in with Apple"
├── "Sign in with GitHub"
│
└── "We never see your name, photo, or email from your provider."
    [Learn more → privacy explainer modal]

↓ OAuth redirect ↓

OAuth Callback
│
├── New user → Alias Generation Flow
└── Returning user → Home Feed

Alias Generation Flow
│
├── Screen: "Generating your identity..."
│   [Animated: random characters cycling before settling]
│
├── Screen: "Your SocioCipher identity is:"
│   [ ΔkR7•ψ2x ]
│   "This is your only public identifier. It cannot be changed."
│   "It reveals nothing about you."
│
├── [Copy alias] [Continue]
│
└── → Privacy & Terms Consent Screen

Privacy & Terms Consent Screen
│
├── Scrollable consent document (must scroll to bottom)
│   - What data we collect (minimal)
│   - What data we do NOT collect
│   - 7-day post expiry
│   - 20-day account expiry
│   - Moderation and safety
│   - Your rights
│
├── ☐ I understand this platform is ephemeral — my posts will be deleted after 7 days
├── ☐ I am 18 years of age or older
├── ☐ I agree to the Content Policy and will not harass, threaten, or post illegal content
│
├── [Agree and Continue] (disabled until all boxes checked and document scrolled)
│
└── → Platform Explainer Screen

Platform Explainer (3 screens, swipeable)
│
├── Screen 1: "No Identity"
│   Icon: broken identity badge
│   "You have no profile. No followers. No history that others can see."
│
├── Screen 2: "Everything Expires"
│   Icon: hourglass
│   "Your posts disappear after 7 days. Your account disappears after 20 days of inactivity."
│
├── Screen 3: "Safe Space, Not Lawless Space"
│   Icon: shield with community
│   "Moderation exists. Harassment, threats, and illegal content are removed."
│   "But honest opinions, criticism, and debate are always welcome."
│
└── [Start Talking] → Home Feed
```

---

## 3. Home Feed Flow

```
Home Feed (Authenticated)
│
├── Top bar: [SocioCipher logo] [Search] [Notifications bell] [Settings]
│
├── Post Composer (always visible at top)
│   ┌────────────────────────────────────────┐
│   │ What's on your mind?                   │
│   │                                        │
│   │ [#topic] [Post]        0/500 chars     │
│   └────────────────────────────────────────┘
│
├── Feed (chronological)
│   ┌────────────────────────────────────────┐
│   │ ΔkR7•ψ2x · 3 hours ago                │
│   │ "This is the content of the post..."  │
│   │ [💬 12 comments] [⚐ Report] [👁 Hide] │
│   │ ⏱ Expires in 4 days 21 hours           │
│   └────────────────────────────────────────┘
│   (repeat for each post)
│
└── Bottom nav: [Feed] [Rooms] [Search] [Notifications] [Settings]
```

### Post Creation Flow
```
User taps composer
│
├── Expands to full composer
│   - Text area (500 char limit with live counter)
│   - Optional: #topic tag (max 3)
│   - Optional: Sensitive topic flag toggle
│
├── [Post] button
│   │
│   ├── Client-side validation (length, empty check)
│   │
│   ├── Server submission
│   │   - Rate limit check
│   │   - Spam signal check
│   │   - Profanity/keyword scan (not censorship — flags for moderation queue if triggered)
│   │
│   ├── Success → Post appears in feed with expiry timer
│   │
│   └── Rate limit exceeded → "You're posting too fast. Wait X minutes."
```

---

## 4. Comment and Reply Flow

```
User taps "12 comments" on a post
│
└── Thread page opens
    │
    ├── Original post at top (with full expiry timer)
    │
    ├── Comment composer
    │   ┌─────────────────────────────────┐
    │   │ Add a comment...               │
    │   │                [Comment] 0/500 │
    │   └─────────────────────────────────┘
    │
    ├── Comments (chronological)
    │   ┌──────────────────────────────────────┐
    │   │ §3Φm≈9q · 1 hour ago                 │
    │   │ "This is a comment..."               │
    │   │ [Reply] [⚐ Report] [👁 Hide]          │
    │   │ ⏱ Expires in 6 days 23 hours          │
    │   └──────────────────────────────────────┘
    │
    └── Nested reply (user taps "Reply")
        │
        ├── Inline reply composer opens below the comment
        │   ┌──────────────────────────────────────┐
        │   │ Replying to §3Φm≈9q: "This is a..." │
        │   │ Your reply...         [Reply] 0/500  │
        │   └──────────────────────────────────────┘
        │
        ├── Reply posts inline below parent comment
        │
        └── Deeper nesting available up to 10 levels
            (levels > 3 collapsed with "Show 4 more replies")
```

---

## 5. Chat Room Flow

```
Rooms Tab
│
├── Room Directory
│   ┌──────────────────────────────────────────┐
│   │ 🟢 Philosophy Corner                     │
│   │ "Is free will an illusion?"              │
│   │ Active 2m ago                            │
│   │ [Join]                                   │
│   └──────────────────────────────────────────┘
│   (list of public rooms, sorted by recent activity)
│
├── [Create Room] button
│   │
│   └── Room creation form:
│       - Room name (max 50 chars)
│       - Topic description (max 200 chars)
│       - Visibility: Public / Unlisted
│       - Sensitive topic tag: yes/no
│       [Create]

User joins a room
│
└── Chat Room Screen
    │
    ├── Room header: name, topic, [Leave] [Report Room] [⋯ more]
    │
    ├── Message history (last 200 messages)
    │   ┌────────────────────────────────────────┐
    │   │ λ7∞Gπ4 · 5:42 PM                      │
    │   │ "Has anyone read Dennett on this?"     │
    │   │ [Reply ↩] [⚐ Report]                   │
    │   │ ⏱ Expires in 6 days 14 hours           │
    │   └────────────────────────────────────────┘
    │
    ├── Message composer
    │   ┌────────────────────────────────────────┐
    │   │ Say something...           [Send] ↑    │
    │   └────────────────────────────────────────┘
    │
    └── Realtime updates via WebSocket
        - New messages appear instantly
        - If a message expires while viewing: 
          "This message has expired" placeholder appears
        - Moderation removals appear as:
          "This message was removed by a moderator"
```

---

## 6. Reporting Flow

```
User taps [⚐ Report] on any content
│
└── Report modal
    │
    ├── "What's the issue?"
    │   ○ Harassment or bullying
    │   ○ Direct threat or violence
    │   ○ Illegal content
    │   ○ Doxxing (personal info shared without consent)
    │   ○ Spam or advertising
    │   ○ Explicit or NSFW content
    │   ○ Hate speech
    │   ○ Impersonation
    │   ○ Other
    │
    ├── Optional: Additional context (200 char text field)
    │
    ├── [Submit Report]
    │
    └── Success screen:
        "Your report has been received."
        "Ticket ID: RPT-2847361"
        "We'll review this and take action if needed."
        "You can check the status using your ticket ID in Settings > My Reports."
```

### What Happens After a Report

```
Report submitted
│
├── Enters moderation queue (priority based on category)
│
├── Community hide votes tracked in parallel
│
├── If content reaches hide threshold → community-hidden pending review
│
├── Moderator reviews:
│   │
│   ├── No violation found
│   │   └── Report closed, content stays
│   │       Reporter notified: "We reviewed and found no violation."
│   │
│   ├── Minor violation (warning)
│   │   └── Content kept, author notified with reason
│   │       "Your post was flagged: [reason]. Please review community guidelines."
│   │
│   ├── Confirmed violation (removal)
│   │   └── Content removed
│   │       Author notified: "Your post was removed for: [reason]."
│   │       Appeal instructions provided.
│   │
│   └── Illegal content / emergency
│       └── Immediate removal
│           Account suspended
│           Law enforcement referral if required
│           No appeal for CSAM, terrorism, direct threats
```

---

## 7. Content Expiry UX States

### Active Content
```
┌──────────────────────────────────────────┐
│ ΔkR7•ψ2x · 4 days ago                   │
│ "The content of this post..."            │
│ [💬 5 comments] [⚐ Report] [👁 Hide]     │
│ ⏱ Expires in 2 days 18 hours             │
└──────────────────────────────────────────┘
```

### Near-Expiry (< 24 hours)
```
┌──────────────────────────────────────────┐
│ ΔkR7•ψ2x · 6 days ago          ⚠ SOON   │
│ "The content of this post..."            │
│ [💬 5 comments] [⚐ Report] [👁 Hide]     │
│ ⏱ Expires in 18 hours 23 min            │
└──────────────────────────────────────────┘
```
(Badge and timer shown in amber/warning color)

### Expired — In-Thread View
```
┌──────────────────────────────────────────┐
│ ◌  This post has expired                 │
│    Deleted 2 hours ago                   │
│    Comments on this post are no longer   │
│    available.                            │
└──────────────────────────────────────────┘
```

### Moderation-Removed — Author View
```
┌──────────────────────────────────────────┐
│ ◌  This post was removed by a moderator  │
│    Reason: Harassment                    │
│    [Appeal this decision] — 13 days left │
└──────────────────────────────────────────┘
```

### Community-Hidden — Other Users' View
```
┌──────────────────────────────────────────┐
│ ▒▒  Content hidden by community votes    │
│     [Show anyway]                        │
└──────────────────────────────────────────┘
```

---

## 8. Account Expiry Warning Flow

```
Day 17 (next login):
┌─────────────────────────────────────────────┐
│ ⚠️  Your account is about to expire         │
│ You haven't logged in for 17 days.          │
│ Inactive accounts are deleted after 20 days. │
│ Log in once more to reset the inactivity    │
│ timer.                                       │
│ [I'm back — reset timer]                    │
└─────────────────────────────────────────────┘

Day 20+ (login attempt after deletion):
┌─────────────────────────────────────────────┐
│ This account has been deleted due to        │
│ inactivity (20 days without login).         │
│ All associated data has been removed.       │
│ You may create a new account.               │
│ [Create New Account]                        │
└─────────────────────────────────────────────┘
```

---

## 9. Settings and Controls Flow

```
Settings Screen
│
├── My Identity
│   └── Your alias: ΔkR7•ψ2x [Copy]
│       "This cannot be changed."
│
├── Safety Controls
│   ├── Blocked aliases [View/Manage]
│   ├── Muted aliases [View/Manage]
│   ├── Muted topics [View/Manage]
│   └── Muted rooms [View/Manage]
│
├── My Reports
│   └── List of submitted reports with status
│       [RPT-2847361 — Under Review]
│       [RPT-2847100 — No Violation Found]
│       [RPT-2846900 — Content Removed]
│
├── Appeals
│   └── List of appeals with status
│
├── Notifications
│   ├── Post expiry warnings: [On/Off]
│   ├── Moderation actions: [On/Off] (cannot fully disable)
│   └── Account expiry warnings: [On/Off] (cannot fully disable)
│
├── Theme
│   └── [Dark] [Light] [System]
│
├── Account
│   ├── Inactivity timer: "Last active: today"
│   ├── Connected provider: Google (cannot change)
│   └── [Delete Account] → confirmation flow
│
└── About
    ├── Privacy Policy
    ├── Content Policy
    ├── Terms of Service
    └── Moderation Guidelines
```

---

## 10. Moderation Feedback States (All Scenarios)

| Scenario | User Sees | Author Sees |
|----------|-----------|------------|
| Content under review | Normal content | Normal content |
| Community-hidden | "Hidden by community [Show]" | Normal content |
| Moderator warning issued | Normal content | Warning notification in app |
| Content removed | "Removed by moderator" placeholder | Removal notice + appeal button |
| Account suspended | Cannot view content | "Your account is suspended. Reason: [X]. Appeal: [Y]." |
| Appeal upheld | Content restored | "Your appeal was successful. Content restored." |
| Appeal denied | Removal placeholder stays | "Your appeal was denied. Decision stands." |
| Content expired normally | Expiry placeholder | Expiry notification in notification center |
