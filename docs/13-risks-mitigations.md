# SocioCipher — Risks and Mitigations

> **Version:** 1.0 | **Date:** 2026-05-11

---

## 1. Legal Liability

### Risk
Operating a platform where users post anonymous content creates legal exposure: defamation claims, illegal content liability, law enforcement demands, and varying jurisdiction requirements (GDPR, CCPA, DSA, CSAM laws, local hate speech laws).

### Mitigations
| Action | Detail |
|--------|--------|
| Section 230 / intermediary liability positioning | Platform is not the publisher of user content; maintains moderation neutrality documentation |
| Proactive CSAM detection | PhotoDNA hash matching before content is public; NCMEC reporting |
| Clear legal request process | Documented workflow; legal counsel review required before any disclosure; minimum-necessary-data policy |
| Jurisdiction-aware operation | Legal review of operating jurisdictions before launch; geo-restrictions if necessary |
| Privacy-by-design as liability shield | Minimal data collection means minimal data to disclose and minimal data breach exposure |
| Terms of Service and Content Policy | Clearly published; users agree explicitly before use; logs of consent kept |
| Regular legal counsel review | Quarterly review of policy compliance against evolving regulations |

---

## 2. Moderation Overload

### Risk
At scale, the volume of reports will exceed moderator capacity, causing SLA breaches, unreviewed harmful content staying live, and burnout among moderation staff.

### Mitigations
| Action | Detail |
|--------|--------|
| Automated pre-screening | Keyword matching, CSAM hashing, and toxicity scoring handle bulk low-difficulty cases before human review |
| Tiered queue | Humans only see content that automation cannot confidently resolve |
| Moderation scaling plan | Defined ratio: 1 moderator per estimated 50k DAU (Phase 1); auto-scale with growth |
| Community moderation offloads | Hide voting handles large-volume minor issues without moderator involvement |
| Moderator wellness policy | Defined maximum shift length for reviewing graphic content; mandatory rotation off Tier 1 content after 2 weeks |
| Tooling investment | Fast, keyboard-driven moderation dashboard; one-click actions; bulk processing tools |
| On-call escalation | Only Tier 1 triggers on-call; Tier 2–4 reviewed during business hours |

---

## 3. Abuse Concentration

### Risk
Pseudonymity combined with room-based discussion may attract concentrated bad actors (harassment coordinators, extremist groups, spam networks) who use the platform as a base of operations.

### Mitigations
| Action | Detail |
|--------|--------|
| No public user search | Bad actors cannot identify and target specific individuals by searching for users |
| No repost/share mechanism | Limits viral amplification of harmful content |
| Room admin controls | Any room can be moderated; platform can emergency-close a room |
| Alias cluster detection | Coordinated multi-account behavior flagged automatically |
| Trust tiers | New accounts and low-trust accounts have severely limited reach |
| Ephemerality | Content disappears in 7 days, limiting how long a harassment campaign can target someone using the same content |
| Rate limits on hide votes | Prevents coordinated false flagging as a silencing tool |
| No external link auto-preview | Reduces value of the platform as a link-posting coordination network |

---

## 4. False Reporting Campaigns

### Risk
Bad actors could coordinate mass false reports to silence legitimate users, triggering auto-hide thresholds and overwhelming moderation queues with junk reports.

### Mitigations
| Action | Detail |
|--------|--------|
| Report accuracy tracking | Reporter trust score decreases when reports are consistently invalidated; repeat false reporters lose reporting power |
| Vote weight reduction | Low-trust accounts contribute less to community hide thresholds |
| Coordinated report pattern detection | Background worker flags when multiple reports on same target originate from a behavioral cluster |
| Human review required for removal | Community hide is reversible; only platform moderators can permanently remove content |
| Queue cost for junk | If a reporter's report rate of false positives exceeds 50%, they are rate-limited on report submissions |
| Appeals protect legitimate users | Users wrongly actioned due to false reports can appeal; appeal success restores trust score |

---

## 5. Coordinated Manipulation

### Risk
Groups could use multiple SocioCipher accounts to coordinate: artificially amplifying certain viewpoints by flooding discussion, coordinating off-platform to target on-platform individuals, or manipulating trending topics.

### Mitigations
| Action | Detail |
|--------|--------|
| No follower infrastructure | Cannot build an audience to coordinate; every alias starts equal |
| No repost / share | Cannot coordinate amplification within the platform |
| Sybil detection | Behavioral fingerprinting identifies alias clusters operating in coordination |
| Trending topic algorithm is dumb | Trending is based purely on tag frequency across all posts — no engagement weighting that can be gamed |
| No personalized feed | You can't push content at specific users algorithmically |
| Ephemerality limits persistence | Coordinated content and posts disappear in 7 days; the effort of coordination has a short payoff window |

---

## 6. Privacy Failure (Data Breach or Leakage)

### Risk
A breach of the database could expose user data. Even pseudonymous data could be de-anonymized if improperly structured.

### Mitigations
| Action | Detail |
|--------|--------|
| Schema separation | `auth.auth_identities` is in a separate schema with separate DB credentials. A breach of the public schema yields only aliases — not auth identities |
| Content tables store alias, not user_id | Even with full `public` schema access, posts cannot be linked to auth identities |
| Disk-level encryption | AES-256 at rest on all DB volumes |
| No IP address storage | Hashed IPs in Redis with 24h TTL only; no raw IP in any DB table |
| Minimal data collection | Less data to breach — no email, no name, no phone, no location |
| Breach response plan | Documented procedure: detect → isolate → notify affected users → regulatory notification within 72h (GDPR) |
| Regular penetration testing | External pentest before launch and annually thereafter |
| Access control auditing | Regular review of who has DB credentials and at what access level |

---

## 7. Data Leakage via Metadata

### Risk
Even without breaching content, an attacker (or overzealous operator) could infer user identity from metadata: posting times, posting frequency, writing style, topic patterns.

### Mitigations
| Action | Detail |
|--------|--------|
| Minute-precision timestamps | Reduces timing correlation precision |
| No behavioral analytics stored | Reading patterns, session duration, and engagement data are not collected |
| No post history aggregation | Users cannot see each other's full post history; posts are surfaced in feed context only |
| Ephemerality | After 7 days there is very little data to analyze for behavioral fingerprinting |
| No persistent search history | Search queries are not stored against user identity |
| Operator access controls | Even internal staff cannot run user-profiling queries without audit logging |

---

## 8. Retention Policy Conflicts

### Risk
Tension between "delete everything quickly" (privacy) and "keep evidence" (safety/legal). Deletion jobs might purge evidence needed for investigation; conversely, preservation holds might be left open indefinitely.

### Mitigations
| Action | Detail |
|--------|--------|
| Explicit retention hold system | Preservation holds must be actively set and actively closed — they don't persist indefinitely by default |
| 14-day hold review cycle | All active preservation holds reviewed every 14 days; must be extended or closed |
| Hold closure triggers purge | When a hold closes, content is purged within 24 hours — no limbo state |
| Legal holds separate from safety holds | Legal holds (from court orders) are tracked separately and cannot be closed without legal sign-off |
| Deletion job failure alerting | Failed deletion jobs alert within 5 minutes; investigated same-day |
| Audit log of holds | Every hold creation, extension, and closure is in the audit log |

---

## 9. Discoverability Issues

### Risk
If content is too hard to find (no algorithm, no personalization, forced ephemerality), users may not find relevant conversations and abandon the platform.

### Mitigations
| Action | Detail |
|--------|--------|
| Chronological feed | Simple, fair, and predictable — users know how it works |
| Room directory | Curated rooms provide structured discovery around topics |
| Hashtag/topic search | Users can find conversations on specific topics without personalization |
| Trending topics | Aggregate tag frequency shows what's being discussed right now — no user tracking |
| Room creation is open | Any user can create a room; organic community formation possible |
| Post volume as health signal | If global feed is too sparse, onboarding can guide new users to active rooms |

---

## 10. User Trust Issues

### Risk
Users may not trust the platform's privacy claims. "You say you don't collect my email, but how do I know?" This is especially acute for privacy-conscious users who are the primary audience.

### Mitigations
| Action | Detail |
|--------|--------|
| Open-source client | Frontend code is open-source so users can verify what is sent to the server |
| Transparent privacy policy | Plain-language policy explaining exactly what is and isn't collected |
| Data minimization is architectural | Point out that the server *cannot* store what it doesn't receive — OAuth scoped to sub-only |
| No third-party scripts | No Google Analytics, no Facebook Pixel, no ad SDK. Users can verify via browser devtools |
| Privacy audit | Third-party privacy audit published publicly |
| Bug bounty for privacy issues | Incentivize security researchers to find and responsibly disclose privacy bugs |
| Clear moderation guidelines | Users can see exactly how and why moderation decisions are made |

---

## 11. Moderator Bias and Inconsistency

### Risk
Moderation at scale will be done by humans who have their own biases. This could result in disproportionate enforcement against certain political viewpoints, demographics, or speech styles.

### Mitigations
| Action | Detail |
|--------|--------|
| Written content policy | Clear, public, specific rules reduce subjective interpretation |
| Documented reasoning required | Every moderation action requires a category and note — creates accountability trail |
| Bias audits | Quarterly review: are removals disproportionately targeting any topic category or alias pattern? |
| Multiple reviewer requirement | Gray-area content requires senior moderator sign-off |
| Appeals to different reviewer | Appeals are never reviewed by the same moderator who made the original decision |
| Moderation guidelines published | Users know what moderators are supposed to do |
| External reviewer | Option for escalated appeals to go to an independent external reviewer |

---

## 12. Platform Viability and Monetization

### Risk
Privacy-first, ad-free design limits traditional monetization. Without revenue, the platform cannot sustain operations, moderation staff, or infrastructure.

### Mitigations
| Action | Detail |
|--------|--------|
| Subscription model | Optional paid tier: longer expiry windows (e.g., 14 days instead of 7), room creation limits increased |
| Institutional/API access | Researchers, journalists, and institutions pay for read-only API access with appropriate agreements |
| Grants and funding | Privacy-focused platforms have attracted funding from privacy-aligned foundations (e.g., Open Technology Fund) |
| Infrastructure efficiency | Aggressive expiry and data minimization keep storage costs low relative to user volume |
| No VC dependency | Prioritize sustainable growth over hyper-growth that requires ad revenue |

---

## Risk Summary Matrix

| Risk | Probability | Impact | Priority |
|------|-------------|--------|---------|
| Legal liability (CSAM, jurisdiction) | Medium | Critical | P0 |
| Moderation overload | High | High | P1 |
| Privacy failure (breach) | Low | Critical | P1 |
| Abuse concentration | Medium | High | P1 |
| False reporting campaigns | Medium | Medium | P2 |
| Retention policy conflicts | Low | High | P2 |
| Coordinated manipulation | Medium | Medium | P2 |
| Metadata leakage | Low | Medium | P2 |
| User trust issues | Medium | Medium | P2 |
| Moderator bias | Medium | Medium | P2 |
| Discoverability issues | Medium | Low | P3 |
| Platform viability | Low | High | P3 |
