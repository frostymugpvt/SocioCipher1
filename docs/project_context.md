# Project Context: SocioCipher

## Overview
SocioCipher is a privacy-first, pseudonymous social platform designed for ephemeral, encrypted, and secure communication. Moving away from traditional Web2 models, SocioCipher operates on zero-knowledge principles where the server is blind to message content, and users remain truly anonymous through public key-based identities.

## Core Directives
1. **Absolute Anonymity**: No Personally Identifiable Information (PII) is collected. No emails, no phone numbers. User identity is established via asymmetric cryptography (Public/Private Key pairs generated on the client).
2. **End-to-End Encryption (E2EE)**: The central database only stores encrypted "digital noise". Decryption keys are held exclusively on the user's local device.
3. **Decentralized Key Management**: The server never sees the private key. Users are responsible for their device security. 
4. **Data Ephemerality**: All content (posts, comments, chat messages) has a strict Time-to-Live (TTL) and is purged from the database after expiration.
5. **Anti-Export & Anti-Capture**: The web interface employs aggressive CSS, JS, and event-listener hacks to deter screenshots and prevent text selection/copying.
6. **Community Moderation**: While content is E2EE, moderation is handled via client-side flagging and a robust, anonymous reporting dashboard to combat spam/abuse without breaking encryption for non-flagged messages.

## Target Audience
Individuals operating in high-risk environments, whistleblowers, and privacy advocates who require a "Red Room" environment where communication is mathematically guaranteed to be private and un-linkable to their real-world identity.
