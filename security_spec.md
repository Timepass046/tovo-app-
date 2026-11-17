# MindDrop Security Specification

## 1. Data Invariants
1. **User Scoping & Isolation**: Every task, habit, habit log, and user preference document belongs strictly to the authenticated `request.auth.uid`. No user can read, list, create, edit, or delete another user's documents.
2. **Identity Integrity**: `userId` field must match `request.auth.uid` on write and cannot be modified after document creation.
3. **Validation & Boundaries**:
   - `title` must be non-empty string <= 200 chars for tasks, <= 150 for habits.
   - Priority, status, frequency, and bucket values must strictly match the permitted enumeration values.
   - Arrays (tags, subtasks, targetDays) must not exceed bounded limits (<= 20 items) to prevent resource exhaustion attacks.
4. **No Blanket Reads**: `allow list` queries must enforce that `resource.data.userId == request.auth.uid`.
5. **Default Deny**: All unmatched collections and routes default to `allow read, write: if false;`.

## 2. The Dirty Dozen Payloads (Adversarial Security Scenarios)
1. **Payload 1 (ID Spoofing)**: Attacker attempts to create a task with `userId: "victim123"` while authenticated as `attacker456`. -> Result: REJECTED (`PERMISSION_DENIED`).
2. **Payload 2 (Unauthenticated Write)**: Unauthenticated visitor attempts to create a task or habit. -> Result: REJECTED.
3. **Payload 3 (Cross-User Read)**: User A attempts to `get` or `list` tasks belonging to User B (`/tasks/{taskOfUserB}`). -> Result: REJECTED.
4. **Payload 4 (Ghost Field / Shadow Update)**: Attacker tries to inject `{ isSuperAdmin: true, billingOverride: true }` into a task update. -> Result: REJECTED.
5. **Payload 5 (Oversized Payload / Denial of Wallet)**: Attacker attempts to write a 1MB string into `title` or `description`. -> Result: REJECTED (exceeds max size limit).
6. **Payload 6 (Invalid Priority Enum)**: Attacker sets `priority: "ultra-critical"`. -> Result: REJECTED (enum violation).
7. **Payload 7 (Invalid Status Enum)**: Attacker sets `status: "hack_complete"`. -> Result: REJECTED.
8. **Payload 8 (Immutability Violation)**: User attempts to update `userId` or `createdAt` to arbitrary timestamps or victim user ID. -> Result: REJECTED.
9. **Payload 9 (Unbounded Array Injection)**: Attacker passes an array with 10,000 subtask objects to crash reads. -> Result: REJECTED (constrained to <= 30 items).
10. **Payload 10 (Path Traversal / Malformed Document ID)**: Attacker creates a document with a 2KB junk character path. -> Result: REJECTED by `isValidId()`.
11. **Payload 11 (Cross-User Habit Log Tampering)**: Attacker logs completions for another user's habit. -> Result: REJECTED.
12. **Payload 12 (Direct Root Collection Scrape)**: Attacker queries `collection(db, 'userPreferences')` without `where('userId', '==', auth.uid)`. -> Result: REJECTED by rule-level list constraint.
