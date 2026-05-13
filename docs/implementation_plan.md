# Implementation Plan & Checklist

This document outlines the step-by-step technical plan to evolve SocioCipher into a secure, scalable, and intelligent platform.

## Phase 1: Security & Encryption Foundation (Next Steps)

### 1. Client-Side Cryptography
*   **Goal**: Ensure the server only sees "digital noise".
*   **Action**: Integrate the Web Crypto API or `tweetnacl.js`.
*   **Flow**:
    1.  On first visit, generate an Ed25519 Keypair (Public/Private).
    2.  Store Private Key securely in `IndexedDB` (never transmitted).
    3.  Register Public Key with the server as the "User ID".
    4.  All payloads sent to `/api/chat` or `/api/posts` must be encrypted using the recipient's public key (for DMs) or a shared symmetric key (for rooms) that is distributed securely.

### 2. Frontend Anti-Capture Hooks
*   **Action**: Inject defensive CSS (`user-select: none`, `-webkit-touch-callout: none`).
*   **Action**: Implement `visibilitychange` event listeners to blur the screen when the app loses focus.
*   **Action**: Hook into `keydown` to intercept common screenshot shortcuts (e.g., `PrtScn`, `Cmd+Shift+4`). *Note: This is imperfect but adds a layer of friction.*

### 3. Advanced Privacy Defenses (Backend & Transport)
*   **Action**: Implement an IP-stripping middleware. This will intercept requests before they hit the database logic and delete all IP-related headers (e.g., `X-Forwarded-For`, `x-real-ip`).
*   **Action**: Develop a metadata-scrubbing utility. Any uploaded media (images, files) must be passed through a library (e.g., `exiftool-vendored` or similar) to strip GPS, device info, and timestamps before storage.
*   **Action**: Implement uniform message padding. All outgoing encrypted message payloads will be padded with random bytes to fixed lengths (e.g., 512, 1024 bytes) to prevent traffic analysis attacks based on packet size.
## Phase 2: AI & Moderation Integration (RAG + Vector DB)

### 1. Vector Database Setup (Pinecone)
*   **Action needed from User**: Create a free tier account on [Pinecone](https://www.pinecone.io/).
*   **Action needed from User**: Generate a Pinecone API Key and Environment name.
*   **Integration**: We will use this to store embeddings of "Public" feed posts to detect similar toxic patterns. (Cannot be used on E2EE DMs).

### 2. Embedding Model / LLM Setup
*   **Action needed from User**: Provide an API key for an embedding service (e.g., OpenAI `text-embedding-ada-002` or open-source local model).
*   **Action needed from User**: Provide an API key for the moderation LLM (OpenAI, Anthropic, or Gemini).

### 3. MCP (Model Context Protocol) Server Setup
*   **Action**: Set up a local MCP server that handles the heavy lifting of RAG processing, keeping the main Next.js API lightweight.
*   **Integration**: Next.js API will communicate with the MCP server to score post toxicity before it enters the database.

## Phase 3: Scaling & Cloud Infrastructure

### 1. Firebase Setup
Currently, we are using SQLite, which is great for local prototyping but will crash with 800 people/200 active users making concurrent websocket/polling requests.
*   **Action needed from User**: Create a [Firebase Project](https://firebase.google.com/).
*   **Action needed from User**: Enable **Firestore Database** and **Firebase Realtime Database**.
*   **Action needed from User**: Go to Project Settings -> Service Accounts -> Generate New Private Key (JSON file). This will be needed to transition our local SQLite db to the cloud.

### 2. Production Grading & Auth
*   **Action**: Implement Rate Limiting (e.g., Upstash Redis).
*   **Action**: Transition Next.js app to a Vercel production deployment.

---

## 📋 ACTION REQUIRED FROM USER

To proceed with Phase 2 and 3, please provide or complete the following:

1.  [ ] **Pinecone API Key & Environment** (for Vector DB)
2.  [ ] **OpenAI / Anthropic / Gemini API Key** (for RAG Moderation pipeline)
3.  [ ] **Firebase Service Account JSON** (for transitioning to scalable DB)
4.  [ ] Confirm if you want to proceed with **Web Crypto API** immediately for E2EE, which will break current plaintext chat histories.
