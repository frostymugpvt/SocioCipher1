# SocioCipher: Production Deployment Guide

This document outlines the differences between the current **Localhost Development** state and the requirements for a **Security-Hardened Production** environment.

## 1. Environment Parity

| Feature | Localhost (Current) | Production (Required) |
|---------|---------------------|-----------------------|
| **Database** | SQLite (`sociocipher.db`) | **PostgreSQL** or **Firebase Firestore**. SQLite will fail on serverless platforms due to filesystem volatility. |
| **Auth (OTP)** | Hardcoded `000000` bypass | **Twilio** or **Firebase Auth**. Remove the `000000` logic immediately. |
| **Media Storage** | `/public/uploads` (Local FS) | **Google Cloud Storage** or **AWS S3**. Local files are not persistent across deployments. |
| **Encryption Keys** | Derived from `roomId` (Weak) | **Shared Room Secrets** distributed via Diffie-Hellman (DH) or a Key Management Service (KMS). |
| **Rate Limiting** | None | **Upstash Redis** or **Cloudflare WAF** to prevent signup/report spam. |

---

## 2. Step-by-Step Production Roadmap

### Phase 1: Infrastructure
1.  **Migrate DB:** Switch from `better-sqlite3` to a managed database.
    *   *Why:* To ensure data persistence and scalability for 800+ users.
2.  **External Storage:** Update `/api/media/upload` to pipe the scrubbed buffer to a cloud bucket instead of `fs.writeFileSync`.
    *   *Implementation:* Use `@google-cloud/storage`.

### Phase 2: Security Hardening
1.  **Remove Backdoors:** 
    *   Edit `lib/auth.ts`: Delete the `if (code === '000000')` logic.
    *   Edit `lib/id.ts`: Ensure `generateOTP` uses a cryptographically secure random generator (currently does).
2.  **Strengthen E2EE:**
    *   Implement a "Join Request" flow where the room admin's client encrypts the room secret with the new member's public key.
    *   *Reason:* The current `roomId` derivation is for demo only and is not secure against a server breach.

### Phase 3: Deployment
1.  **Environment Variables:** Move all "Secret" strings (Gemini Key, DB URL) to a `.env.production` file or Cloud Secret Manager.
2.  **Logging:** Ensure `No IP Logging` middleware is active in the production reverse proxy (e.g., Nginx or Vercel edge).

---

## 3. Why TypeScript (TS/TSX)?

We exclusively use TypeScript for SocioCipher to uphold the **Zero-Knowledge** promise through code reliability:

1.  **Cryptographic Integrity:** In JS, an `undefined` variable in the encryption chain might lead to sending plaintext by accident. TS forces us to handle all states (null/undefined) explicitly.
2.  **Complex Data Structures:** SocioCipher handles complex nested objects (Communities > Rooms > E2EE Messages). TS interfaces ensure that we don't try to access a property that doesn't exist, preventing runtime crashes.
3.  **Refactoring Safety:** Security protocols evolve. If we change how a `Session` is structured, TS identifies every single line of code that needs an update, preventing "Security Regression" bugs.
4.  **Developer Efficiency:** For a small team/founder, TS reduces the time spent debugging "silly" mistakes by 40%, allowing focus on core security logic.
