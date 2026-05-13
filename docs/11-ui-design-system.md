# SocioCipher — UI & Design System

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. Design Philosophy

**Core values driving every UI decision:**

| Value | Implementation |
|-------|---------------|
| **Content-first** | Text and discussion dominate. No sidebars full of suggested users, trending personalities, or ads. |
| **Identity-absent** | Aliases are small, unclickable, and visually de-emphasized. No avatars. No profile photos. |
| **Vanity-free** | No visible like counts, follower counts, or engagement scores. |
| **Ephemeral awareness** | Every piece of content shows a live expiry timer — users are always reminded that this is temporary. |
| **Privacy-centric** | No tracking pixels, no third-party widgets, no social sharing buttons. |
| **Dark-first** | Dark theme is default. Light theme is an option. Both are fully supported. |

---

## 2. Color System

### Dark Theme (Default)

```css
--color-bg-primary:        #0d0d0f;   /* Page background */
--color-bg-surface:        #16161a;   /* Cards, panels */
--color-bg-elevated:       #1e1e24;   /* Modals, dropdowns */
--color-bg-input:          #1a1a20;   /* Input fields */

--color-text-primary:      #e8e8f0;   /* Main body text */
--color-text-secondary:    #8888a0;   /* Timestamps, aliases, metadata */
--color-text-muted:        #555566;   /* Placeholders, disabled */
--color-text-inverse:      #0d0d0f;   /* Text on light backgrounds */

--color-accent-primary:    #7c6aff;   /* Primary CTA, links, active states */
--color-accent-hover:      #9180ff;   /* Hover state of primary */
--color-accent-secondary:  #2d2d40;   /* Subtle accent backgrounds */

--color-warning:           #f0a02a;   /* Expiry warnings, near-expiry */
--color-danger:            #e05252;   /* Errors, destructive actions */
--color-success:           #4caf88;   /* Success states, restored content */
--color-info:              #4a90c4;   /* Informational notices */

--color-border:            #2a2a35;   /* Dividers, card borders */
--color-border-subtle:     #1e1e28;   /* Very subtle separators */

--color-moderation-hidden: #2a2520;   /* Community-hidden content background */
--color-moderation-removed:#2a1e1e;   /* Moderator-removed content background */
--color-expiry-critical:   #3a2800;   /* < 2 hours remaining */
```

### Light Theme

```css
--color-bg-primary:        #f5f5f8;
--color-bg-surface:        #ffffff;
--color-bg-elevated:       #ffffff;
--color-bg-input:          #f0f0f5;

--color-text-primary:      #111118;
--color-text-secondary:    #666678;
--color-text-muted:        #aaaabc;

--color-accent-primary:    #5a4aee;
--color-accent-hover:      #4a3adc;
--color-accent-secondary:  #eeecff;

--color-border:            #e0e0ec;
--color-border-subtle:     #eeeeF8;
```

---

## 3. Typography

```css
/* Import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

--font-sans:   'Inter', system-ui, -apple-system, sans-serif;
--font-mono:   'JetBrains Mono', 'Fira Code', monospace;  /* Used for aliases */

--text-xs:     0.75rem;    /* 12px — timestamps, metadata */
--text-sm:     0.875rem;   /* 14px — secondary text, labels */
--text-base:   1rem;       /* 16px — body, post content */
--text-lg:     1.125rem;   /* 18px — section headers */
--text-xl:     1.25rem;    /* 20px — page titles */
--text-2xl:    1.5rem;     /* 24px — hero text */

--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;

--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-relaxed:1.65;
```

**Alias display rule:** All aliases are displayed in `font-mono` at `--text-xs` or `--text-sm`, in `--color-text-secondary`. They are visually subordinate to content.

---

## 4. Spacing and Layout

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */

--radius-sm:  4px;
--radius-md:  8px;
--radius-lg:  12px;
--radius-full: 9999px;

--max-content-width: 640px;   /* Feed and thread page */
--max-room-width:    800px;   /* Chat room */
--sidebar-width:     240px;   /* Navigation (desktop) */
```

---

## 5. Page Layouts

### 5.1 Home Feed

```
┌─────────────────────────────────────────────┐
│  TOPBAR: [Logo] [Search] [🔔] [⚙]           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ POST COMPOSER                       │    │
│  │ What's on your mind?               │    │
│  │ [#tag]                   [Post]    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ΔkR7•ψ2x  ·  3h ago    ⏱ 4d 21h  │    │
│  │                                     │    │
│  │ Post content goes here. Up to 500   │    │
│  │ characters of honest expression.    │    │
│  │                                     │    │
│  │ #topic                              │    │
│  │ ─────────────────────────────────  │    │
│  │ 💬 12    [⚐]  [👁 Hide]            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Load more]                                │
│                                             │
├─────────────────────────────────────────────┤
│  BOTTOM NAV: [🏠] [🚪 Rooms] [🔍] [🔔] [⚙] │
└─────────────────────────────────────────────┘
```

**Design notes:**
- No avatar or profile photo next to alias
- Alias is small, monospace, low contrast — intentionally de-emphasized
- Expiry timer shown in amber when < 24h, red when < 2h
- Comment count shown (encourages discussion) but no like/upvote count shown
- Single column, max-width 640px, centered

---

### 5.2 Thread Page (Post + Comments)

```
┌──────────────────────────────────────────┐
│  [← Back]                               │
├──────────────────────────────────────────┤
│  ΔkR7•ψ2x  ·  3h ago    ⏱ 4d 21h       │
│                                          │
│  Full post content displayed here.       │
│  Up to 500 characters.                   │
│  #topic                                  │
│  ─────────────────────────────────────   │
│  [⚐ Report]  [👁 Hide]                   │
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────┐    │
│  │ Comment...           [Comment]  │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  §3Φm≈9q  ·  2h ago    ⏱ 4d 22h        │
│  "First comment here..."                 │
│  [Reply]  [⚐]  [👁]                      │
│                                          │
│    └── λ7∞Gπ4  ·  1h ago               │
│        "Nested reply..."                 │
│        [Reply]  [⚐]  [👁]               │
│                                          │
│          └── ΔkR7•ψ2x  ·  30m ago       │
│              "Deeper reply..."           │
│              [Show 2 more replies ↓]    │
└──────────────────────────────────────────┘
```

---

### 5.3 Chat Room

```
┌──────────────────────────────────────────┐
│  Philosophy Corner                       │
│  Is free will an illusion?              │
│  [Leave]  [⚐]  [⋯]                      │
├──────────────────────────────────────────┤
│                                          │
│  λ7∞Gπ4  ·  5:42 PM    ⏱ 6d 14h        │
│  "Has anyone read Dennett on this?"      │
│  [↩ Reply]  [⚐]                         │
│                                          │
│  §3Φm≈9q  ·  5:44 PM    ⏱ 6d 14h       │
│  "Yes — Elbow Room is essential"         │
│  [↩ Reply]  [⚐]                         │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ This message has expired         │    │  ← greyed out placeholder
│  └──────────────────────────────────┘    │
│                                          │
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────┐    │
│  │ Say something...        [Send ↑] │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

---

### 5.4 Onboarding — Alias Reveal Screen

```
┌──────────────────────────────────────────┐
│                                          │
│         ✦  Your identity is             │
│                                          │
│    ┌──────────────────────────────┐      │
│    │                              │      │
│    │      ΔkR7•ψ2x               │      │
│    │                              │      │
│    └──────────────────────────────┘      │
│                                          │
│   This is your only public identifier.  │
│   It cannot be changed.                  │
│   It reveals nothing about you.          │
│                                          │
│   [Copy alias]                           │
│                                          │
│               [Continue →]               │
│                                          │
└──────────────────────────────────────────┘
```

The alias box animates — characters cycle randomly for 1.5 seconds before settling on the final alias (like a slot machine). This moment is memorable and reinforces the privacy-first identity model.

---

### 5.5 Expired Content View

```
┌──────────────────────────────────────────┐
│  [← Back to feed]                        │
├──────────────────────────────────────────┤
│                                          │
│   ◌  This post has expired              │
│                                          │
│      Deleted 2 hours ago.               │
│      Content on SocioCipher is          │
│      ephemeral by design.               │
│                                          │
│   Comments on this post are no longer   │
│   available.                             │
│                                          │
│              [Return to feed]            │
│                                          │
└──────────────────────────────────────────┘
```

---

### 5.6 Moderation States

**Community Hidden (other users):**
```
┌──────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Content hidden by community votes       │
│  [Show anyway]                           │
└──────────────────────────────────────────┘
```

**Moderator Removed (author's view):**
```
┌──────────────────────────────────────────┐  background: --color-moderation-removed
│  ✕  This post was removed               │
│     Reason: Targeted harassment          │
│                                          │
│  [Appeal this decision]  13 days left   │
└──────────────────────────────────────────┘
```

**Suspended Account:**
```
┌──────────────────────────────────────────┐
│  ⚠  Your account is suspended            │
│                                          │
│  Reason: Repeated harassment violations  │
│  Suspended until: May 18, 2026          │
│                                          │
│  [File an appeal]                        │
└──────────────────────────────────────────┘
```

---

## 6. Component Library Highlights

### Post Card
- Alias: monospace, small, secondary color, NOT a link
- Content: primary text, readable font size (16px), normal line height
- Tags: small pills, muted color
- Expiry timer: right-aligned, color changes with urgency (neutral → amber → red)
- Action row: icon buttons only (no labels on mobile), low visual weight

### Comment Component
- Indentation: 16px per nesting level
- Thread lines: subtle vertical line connecting parent to children
- Deep threads (> 3): collapsed with "Show N more replies" toggle
- Parent context shown on deep replies (truncated, italic)

### Room Message
- Alias + timestamp on same line, small
- Content below, full width
- Reply indicator: shows parent alias + first 40 chars of parent content
- Expiry timer only shown on hover (reduces visual noise in fast-moving rooms)

### Expiry Timer
```
Active (> 24h):   "4d 21h"          color: --color-text-muted
Warning (< 24h):  "⚠ 18h 32m"      color: --color-warning
Critical (< 2h):  "🔴 1h 12m"      color: --color-danger  (pulsing animation)
```

### Report Button
- Icon: ⚐ (flag)
- Opens modal on click
- Never shows report counts to users (no pile-on signal)

---

## 7. Accessibility

- WCAG 2.1 AA compliance target
- All interactive elements have visible focus rings
- Color is never the sole conveyor of meaning (always paired with icon or text)
- Font sizes minimum 14px for all readable content
- Touch targets minimum 44×44px on mobile
- Screen reader labels on all icon-only buttons
- Reduced motion preference respected (disable slot-machine animation, disable pulsing timers)
- Keyboard navigation fully supported (tab order, escape to close modals)

---

## 8. What the UI Deliberately Omits

| Missing Element | Why |
|----------------|-----|
| Avatar / profile photo | No identity branding |
| Follower / following count | No social graph |
| Like / upvote count | No performative metric |
| Profile page (clickable alias) | No persistent identity |
| "Trending users" / "Who to follow" | No personality amplification |
| Share / repost button | No viral amplification mechanism |
| Read receipts | Privacy |
| Online status indicators | Privacy |
| Post view count | No vanity metric |
| Notification count badges (persistent) | Reduces anxiety and compulsive checking |
