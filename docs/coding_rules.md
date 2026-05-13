# SocioCipher Coding Rules & Standards

## 1. Zero Trust & Cryptography
*   **NEVER log plaintext messages** on the server or in the console. 
*   All encryption and decryption MUST happen locally on the client (browser/device). 
*   Use established, audited cryptographic libraries (e.g., `tweetnacl`, `libsodium`, or the Web Crypto API). Avoid writing custom cryptographic primitives.

## 2. No PII Collection
*   Do not request, validate, or store phone numbers, email addresses, real names, or IP addresses in any permanent database table.
*   Authentication schemas must rely strictly on cryptographic signatures (e.g., verifying a challenge string using a public key).

## 3. Ephemerality First
*   All database entities (posts, comments, messages) must have an `expires_at` column.
*   Implement a cron job or background worker that aggressively purges expired records. Do not merely "soft delete" (setting a status flag); physically delete the rows to prevent forensic recovery.

## 4. Frontend Anti-Capture Constraints
*   Every sensitive component (ChatRoom, Feed) must wrap its content in a container with the `no-select` CSS class.
*   Implement a global `contextmenu` preventDefault listener to block right-clicks.
*   Use standard React strict mode. 

## 5. Security & Network
*   All API routes must check for a valid session token (which will eventually be tied to the public key signature).
*   Implement rigorous rate-limiting on all POST endpoints to prevent spam.
*   Never trust the client. Even though data is E2EE, metadata (timestamps, content type) must be validated.
*   **No IP Logging**: Configure Next.js/Express server or middleware to explicitly strip the `X-Forwarded-For` and client IP addresses from requests before they reach the database or application logs.

## 6. Advanced Privacy Defenses
*   **Metadata Scrubbing**: All uploaded files (images/documents) must pass through a scrubbing script to remove EXIF data (GPS coordinates, device model, creation time) before they are sent to the storage bucket or served to other users.
*   **Uniform Message Padding**: All encrypted message payloads must be padded to fixed sizes (e.g., 512 bytes, 1024 bytes) so that an observer intercepting network traffic cannot infer the content length or conversation flow based on packet sizes.
