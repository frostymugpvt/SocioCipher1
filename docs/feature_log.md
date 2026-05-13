# SocioCipher Feature Log

## Version 0.1.0 - Alpha Phase

### Core Infrastructure
*   **Database**: SQLite (`better-sqlite3`) configured with auto-migrations.
*   **Authentication**: Basic session tokens (to be migrated to Key-Pair Signatures).
*   **Framework**: Next.js 14, Tailwind CSS, Shadcn UI.

### Privacy & Identity
*   **Anonymous Personas**: Users are assigned random anonymous names (e.g., "Silent Observer", "Digital Nomad").
*   **Zero PII Requirement**: Account creation requires no email or phone number.
*   **Legal Protections**: Updated terms explicitly shifting legal responsibility for generated content away from the platform operators.

### Communication Channels
*   **Global Feed**: Threaded discussion forum allowing anonymous posting.
*   **Chat Rooms**: Real-time websocket-based (or polling-based) chat rooms for continuous dialogue.

### Moderation System
*   **Community Flagging**: Any user can flag a post, comment, or chat message.
*   **Public Report Counts**: UI displays the number of reports an item has received.
*   **Moderation Dashboard**: Administrative view to monitor flagged content, dismiss reports, delete content, or suspend users.

---

## Planned Features (Roadmap)

### Version 0.2.0 - Security Hardening
*   **End-to-End Encryption (E2EE)**: Implement Web Crypto API. The central server will only store encrypted blobs.
*   **Decentralized Key Management**: Private keys generated and stored locally in `localStorage` or `IndexedDB`.
*   **Anti-Capture UI**: CSS/JS logic to disable text selection, blur out of focus, and prevent standard screenshot workflows (to the extent possible in browser).

### Version 0.3.0 - Intelligent Moderation
*   **Vector Database (Pinecone)**: Store embeddings of (decrypted/metadata) interactions for semantic search. *Note: Need to resolve conflict between E2EE and Server-Side semantic search. If RAG is used, it must only analyze public/non-E2EE metadata or use homomorphic encryption/client-side ML.*
*   **AI RAG Pipeline**: Integration with LLMs (e.g., via MCP) to automatically classify harmful patterns without human intervention.

### Version 0.4.0 - Scale & Peer-to-Peer
*   **WebRTC Integration**: Transition chat from server-routed to pure peer-to-peer for sensitive rooms.
*   **Firebase Migration**: Transition SQLite to Firebase Realtime Database / Firestore for scalable concurrent connections.
