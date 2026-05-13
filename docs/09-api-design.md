# SocioCipher — API Design

> **Version:** 1.0 | **Date:** 2026-05-11  
> **Base URL:** `https://api.sociocipher.io/v1`  
> **Auth:** Bearer token (JWT session token) in `Authorization` header  
> **Format:** JSON request/response unless noted

---

## Authentication Headers

```http
Authorization: Bearer <session_token>
X-Request-ID: <uuid>        (client-generated, for tracing)
Content-Type: application/json
```

---

## 1. Auth Endpoints

### `POST /auth/callback`
OAuth callback — exchanges OAuth code for a session token.

**Request:**
```json
{
  "provider": "google",
  "code": "4/0AX4XfW...",
  "redirect_uri": "https://sociocipher.io/auth/callback"
}
```

**Response `201` (new user):**
```json
{
  "session_token": "eyJhbGci...",
  "expires_at": "2026-05-12T18:00:00Z",
  "is_new_user": true,
  "alias": "ΔkR7•ψ2x",
  "onboarding_required": true
}
```

**Response `200` (returning user):**
```json
{
  "session_token": "eyJhbGci...",
  "expires_at": "2026-05-12T18:00:00Z",
  "is_new_user": false,
  "alias": "ΔkR7•ψ2x",
  "onboarding_required": false,
  "account_status": "active"
}
```

**Error `403` (account suspended):**
```json
{
  "error": "account_suspended",
  "reason": "harassment",
  "suspension_until": "2026-05-18T00:00:00Z",
  "appeal_available": true
}
```

---

### `POST /auth/signout`
Invalidates current session token.

**Response `204`:** No content.

---

### `GET /auth/me`
Returns current user's own identity info.

**Response `200`:**
```json
{
  "alias": "ΔkR7•ψ2x",
  "account_status": "active",
  "trust_tier": "standard",
  "created_at": "2026-04-01T12:00:00Z",
  "last_active_at": "2026-05-11T18:00:00Z",
  "inactivity_days_remaining": 18
}
```

---

## 2. Post Endpoints

### `POST /posts`
Create a new feed post.

**Request:**
```json
{
  "content": "The thing nobody wants to admit about productivity culture is...",
  "tags": ["productivity", "culture"],
  "is_sensitive": false
}
```

**Response `201`:**
```json
{
  "post_id": "550e8400-e29b-41d4-a716-446655440000",
  "alias": "ΔkR7•ψ2x",
  "content": "The thing nobody wants to admit about productivity culture is...",
  "tags": ["productivity", "culture"],
  "created_at": "2026-05-11T18:22:00Z",
  "expires_at": "2026-05-18T18:22:00Z",
  "status": "active"
}
```

**Error `429` (rate limited):**
```json
{
  "error": "rate_limit_exceeded",
  "limit": "10 posts per hour",
  "retry_after_seconds": 342
}
```

---

### `GET /posts/feed`
Retrieve global feed (paginated, chronological).

**Query params:**
- `cursor` — ISO timestamp for pagination (posts before this time)
- `limit` — max 30, default 20

**Response `200`:**
```json
{
  "posts": [
    {
      "post_id": "550e8400-...",
      "alias": "ΔkR7•ψ2x",
      "content": "Post content here...",
      "tags": ["culture"],
      "is_sensitive": false,
      "created_at": "2026-05-11T18:22:00Z",
      "expires_at": "2026-05-18T18:22:00Z",
      "comment_count": 14,
      "status": "active"
    }
  ],
  "next_cursor": "2026-05-11T17:45:00Z",
  "has_more": true
}
```

**Note:** Posts from blocked aliases are filtered server-side. Muted topics filtered server-side.

---

### `GET /posts/:post_id`
Get a single post.

**Response `200`:** Single post object (same shape as feed item).  
**Response `404`:** Post not found or expired.  
**Response `410`:**
```json
{ "error": "post_expired", "expired_at": "2026-05-10T18:22:00Z" }
```

---

### `DELETE /posts/:post_id`
Author deletes their own post before expiry.

**Response `204`:** Deleted successfully.  
**Response `403`:** Not the post author.

---

## 3. Comment Endpoints

### `POST /posts/:post_id/comments`
Create a top-level comment.

**Request:**
```json
{
  "content": "This is exactly what I've been thinking...",
  "parent_id": null
}
```

**Response `201`:**
```json
{
  "comment_id": "660f9500-...",
  "post_id": "550e8400-...",
  "parent_id": null,
  "alias": "ΔkR7•ψ2x",
  "content": "This is exactly what I've been thinking...",
  "depth": 0,
  "created_at": "2026-05-11T18:30:00Z",
  "expires_at": "2026-05-18T18:22:00Z",
  "status": "active"
}
```

---

### `POST /posts/:post_id/comments` (nested reply)
Create a reply to an existing comment (set `parent_id`).

**Request:**
```json
{
  "content": "Totally agree, but have you considered...",
  "parent_id": "660f9500-..."
}
```

**Response `201`:** Same shape as above, with `depth` incremented.  
**Error `422`:**
```json
{ "error": "max_nesting_depth_reached", "max_depth": 10 }
```

---

### `GET /posts/:post_id/comments`
Get the comment thread for a post.

**Query params:**
- `cursor` — comment ID for pagination
- `limit` — max 50, default 20
- `depth` — max depth to return (default: 3, collapse deeper)

**Response `200`:**
```json
{
  "comments": [
    {
      "comment_id": "660f9500-...",
      "parent_id": null,
      "alias": "§3Φm≈9q",
      "content": "First comment...",
      "depth": 0,
      "created_at": "2026-05-11T18:30:00Z",
      "expires_at": "2026-05-18T18:22:00Z",
      "status": "active",
      "reply_count": 3,
      "replies": [
        {
          "comment_id": "770a0600-...",
          "parent_id": "660f9500-...",
          "alias": "λ7∞Gπ4",
          "content": "Nested reply...",
          "depth": 1,
          "reply_count": 0,
          "replies": []
        }
      ]
    }
  ],
  "next_cursor": "660f9500-...",
  "has_more": false
}
```

---

## 4. Room Endpoints

### `POST /rooms`
Create a new chat room.

**Request:**
```json
{
  "name": "Philosophy Corner",
  "description": "Is free will an illusion?",
  "visibility": "public",
  "is_sensitive": false
}
```

**Response `201`:**
```json
{
  "room_id": "770a0600-...",
  "name": "Philosophy Corner",
  "description": "Is free will an illusion?",
  "visibility": "public",
  "creator_alias": "ΔkR7•ψ2x",
  "created_at": "2026-05-11T18:00:00Z",
  "status": "active"
}
```

---

### `GET /rooms`
List public rooms (room directory).

**Query params:**
- `cursor` — room ID for pagination
- `limit` — max 30, default 20
- `q` — search by name or description

**Response `200`:**
```json
{
  "rooms": [
    {
      "room_id": "770a0600-...",
      "name": "Philosophy Corner",
      "description": "Is free will an illusion?",
      "is_sensitive": false,
      "last_message_at": "2026-05-11T18:50:00Z",
      "status": "active"
    }
  ],
  "next_cursor": "770a0600-...",
  "has_more": true
}
```

---

### `POST /rooms/:room_id/join`
Join a room.

**Response `200`:**
```json
{
  "room_id": "770a0600-...",
  "joined_at": "2026-05-11T18:55:00Z",
  "role": "member",
  "recent_messages": [ /* last 50 messages */ ]
}
```

---

### `DELETE /rooms/:room_id/leave`
Leave a room.

**Response `204`:** Left successfully.

---

### `POST /rooms/:room_id/messages`
Send a message to a room.

**Request:**
```json
{
  "content": "Has anyone read Dennett on free will?",
  "reply_to_id": null
}
```

**Response `201`:**
```json
{
  "message_id": "880b0700-...",
  "room_id": "770a0600-...",
  "alias": "ΔkR7•ψ2x",
  "content": "Has anyone read Dennett on free will?",
  "reply_to_id": null,
  "created_at": "2026-05-11T19:00:00Z",
  "expires_at": "2026-05-18T19:00:00Z"
}
```

---

### `GET /rooms/:room_id/messages`
Get recent messages in a room (REST fallback — realtime preferred).

**Query params:**
- `before` — ISO timestamp, get messages before this time
- `limit` — max 100, default 50

**Response `200`:**
```json
{
  "messages": [
    {
      "message_id": "880b0700-...",
      "alias": "ΔkR7•ψ2x",
      "content": "Has anyone read Dennett on free will?",
      "created_at": "2026-05-11T19:00:00Z",
      "expires_at": "2026-05-18T19:00:00Z",
      "status": "active"
    }
  ],
  "has_more": true
}
```

---

## 5. Reporting and Moderation Endpoints

### `POST /reports`
Submit a report on any content.

**Request:**
```json
{
  "content_type": "post",
  "content_id": "550e8400-...",
  "category": "harassment",
  "additional_context": "Repeated targeting over 3 posts in the last hour."
}
```

**Response `201`:**
```json
{
  "ticket_id": "RPT-2847361",
  "status": "pending",
  "estimated_review_time": "within 24 hours",
  "created_at": "2026-05-11T19:10:00Z"
}
```

---

### `GET /reports`
Get all reports submitted by the current user.

**Response `200`:**
```json
{
  "reports": [
    {
      "ticket_id": "RPT-2847361",
      "content_type": "post",
      "category": "harassment",
      "status": "resolved_removed",
      "created_at": "2026-05-11T19:10:00Z",
      "resolved_at": "2026-05-11T22:00:00Z"
    }
  ]
}
```

---

### `POST /hide-votes`
Cast a community hide vote on content.

**Request:**
```json
{
  "content_type": "post",
  "content_id": "550e8400-..."
}
```

**Response `200`:**
```json
{
  "vote_recorded": true,
  "current_vote_count": 8,
  "threshold": 15,
  "content_hidden": false
}
```

**Response `409`:** Already voted on this content.

---

## 6. Safety Control Endpoints

### `POST /blocks`
Block an alias.

**Request:**
```json
{ "alias": "§3Φm≈9q" }
```

**Response `201`:**
```json
{ "blocked_alias": "§3Φm≈9q", "created_at": "2026-05-11T19:15:00Z" }
```

---

### `DELETE /blocks/:alias`
Unblock an alias.

**Response `204`.**

---

### `POST /mutes`
Mute an alias, room, or topic.

**Request:**
```json
{
  "entity_type": "alias",
  "entity_value": "§3Φm≈9q"
}
```

**Response `201`:**
```json
{ "entity_type": "alias", "entity_value": "§3Φm≈9q", "muted_at": "2026-05-11T19:16:00Z" }
```

---

### `DELETE /mutes`
Remove a mute.

**Request:** Same shape as POST.  
**Response `204`.**

---

## 7. Appeals Endpoints

### `POST /appeals`
Submit an appeal on a moderation action.

**Request:**
```json
{
  "action_id": "mod-action-uuid",
  "reason_category": "content_did_not_violate_policy",
  "context_text": "This was clearly satire targeting a public figure's policy position, not a personal attack."
}
```

**Response `201`:**
```json
{
  "appeal_id": "appeal-uuid",
  "status": "pending",
  "deadline_at": "2026-05-25T19:00:00Z",
  "expected_response": "within 72 hours"
}
```

---

### `GET /appeals`
Get all appeals filed by current user.

**Response `200`:**
```json
{
  "appeals": [
    {
      "appeal_id": "appeal-uuid",
      "action_type": "content_removal",
      "status": "upheld",
      "filed_at": "2026-05-11T19:00:00Z",
      "resolved_at": "2026-05-12T14:00:00Z",
      "review_notes": "On review, content was satire. Action reversed."
    }
  ]
}
```

---

## 8. Account Endpoints

### `DELETE /account`
Request voluntary account deletion.

**Request:**
```json
{ "confirmation": "DELETE_MY_ACCOUNT" }
```

**Response `202`:**
```json
{
  "status": "deletion_scheduled",
  "scheduled_at": "2026-05-12T19:20:00Z",
  "message": "Your account and all associated content will be permanently deleted within 24 hours."
}
```

---

### `GET /account/export`
Request a data export.

**Response `202`:**
```json
{
  "export_id": "export-uuid",
  "status": "processing",
  "estimated_ready_at": "2026-05-11T20:00:00Z"
}
```

**`GET /account/export/:export_id`** — Poll for export readiness. Returns a signed download URL when ready.

---

## 9. Search Endpoints

### `GET /search`
Search posts, rooms, and topics.

**Query params:**
- `q` — search query string (required)
- `type` — `posts` | `rooms` | `topics` | `all` (default: `all`)
- `cursor`, `limit`

**Response `200`:**
```json
{
  "results": {
    "posts": [
      {
        "post_id": "550e8400-...",
        "alias": "ΔkR7•ψ2x",
        "content_snippet": "...the thing nobody wants to admit about **productivity**...",
        "tags": ["productivity"],
        "created_at": "2026-05-11T18:22:00Z",
        "expires_at": "2026-05-18T18:22:00Z"
      }
    ],
    "rooms": [ /* room objects */ ],
    "topics": [ /* topic tag objects */ ]
  },
  "has_more": false
}
```

---

## 10. Internal / Worker Endpoints (Not Public)

These are internal endpoints called only by worker processes, not exposed externally.

| Endpoint | Caller | Purpose |
|----------|--------|---------|
| `POST /internal/jobs/delete-post` | Deletion worker | Purge a post and its comments |
| `POST /internal/jobs/delete-account` | Deletion worker | Purge an account and its content |
| `POST /internal/jobs/score-content` | Abuse worker | Run toxicity scoring on content |
| `POST /internal/jobs/recalc-trust` | Trust worker | Recalculate trust score for an alias |
| `POST /internal/events/content-expired` | Deletion worker | Emit WebSocket event for expired content |
| `POST /internal/moderation/emergency-lockdown` | Mod service | Emergency content lockdown |

All internal endpoints:
- Require a separate internal API key (not user JWT)
- Are bound to internal network only (not routable from internet)
- Are rate-limited per worker

---

## 11. Error Response Standard

All errors follow this shape:

```json
{
  "error": "snake_case_error_code",
  "message": "Human-readable description",
  "details": { /* optional structured details */ },
  "request_id": "uuid-for-tracing"
}
```

| HTTP Code | When Used |
|-----------|----------|
| `400` | Invalid request body / missing required fields |
| `401` | Missing or invalid session token |
| `403` | Authenticated but forbidden (wrong user, suspended) |
| `404` | Resource not found |
| `409` | Conflict (duplicate action, e.g., double vote) |
| `410` | Resource existed but is now gone (expired content) |
| `422` | Semantically invalid request (e.g., max depth exceeded) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `503` | Service temporarily unavailable |
