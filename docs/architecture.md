# SocioCipher Architecture Specification

## 1. System Overview
SocioCipher operates as a Next.js (App Router) full-stack application backed by a local SQLite database (Better-SQLite3) for rapid prototyping, which is abstracted to allow an easy migration to a cloud SQL/NoSQL solution.

## 2. Authentication & Identity Layer
*   **Public Key Cryptography**: Instead of passwords or OTPs, users generate an RSA/ECC keypair upon device initialization.
*   **Identity Representation**: The public key is hashed to generate a unique `badgeNumber` (e.g., `SC-1A2B-3C4D`).
*   **Registration**: The client registers the public key with the server. The server stores `{ badgeNumber, publicKey }`. No PII is stored.
*   **Session Management**: Authentication relies on signing a server-provided challenge using the locally stored private key.

## 3. End-to-End Encryption (E2EE) Layer
*   **Message Encryption**: For Direct Messages, the sender encrypts the payload using the recipient's public key. For group channels, a symmetric "Session Key" is generated, encrypted against the public key of every authorized member, and stored securely.
*   **Server Blindness**: The server only routes and stores ciphertext. It possesses zero capability to decrypt message payloads.
*   **Decentralized Keys**: Private keys never leave the `IndexedDB` or `localStorage` of the client's browser. If the server is breached, the attacker retrieves mathematically intractable noise.

## 4. Anti-Capture & Data Protection
*   **Screenshot Prevention**: Use CSS (`user-select: none`, `filter: blur(0px)`) and JS event listeners on the `keyup` and `visibilitychange` APIs. If a user attempts to screenshot (via PrintScreen) or records the screen, the UI overlays a black block or blurs entirely.
*   **Export Ban**: Console access is discouraged via debugger traps, and right-click/copy functionalities are intercepted and blocked.
*   **Watermarking**: Hidden, micro-opacity watermarks tied to the user's alias are embedded in the DOM. If they use an external camera, the leak can be traced back to the leaker.

## 5. RAG & Vector Database Integration
*   **Pinecone / Vectorization**: To facilitate intelligent, anonymous matching or "safe semantic search", encrypted metadata or locally processed vectors are stored in Pinecone. The MCP (Model Context Protocol) is used to feed these vectors into a local/remote AI agent to flag harmful context *before* encryption, or analyze local plain-text before it gets sent to the server.

## 6. Infrastructure Stack
*   **Frontend**: React, Next.js, CSS Modules / Vanilla CSS.
*   **Backend**: Next.js API Routes.
*   **Database**: SQLite (current) -> PostgreSQL/Firebase (future).
*   **Vector DB**: Pinecone.
*   **AI Integration**: MCP Server via Anthropic/OpenAI APIs for real-time local moderation.
