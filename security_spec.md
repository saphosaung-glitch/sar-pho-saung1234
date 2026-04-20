# Security Specification for Sar Taw Set Royal Caterer

## Data Invariants
1. A user profile is identified by their phone number (clean digits).
2. A user can only access their own profile data, orders, and addresses.
3. Access to an account from a new device requires a one-time authentication code (`authCode`).
4. Admins have full read/write access to all collections for management.
5. `authCode` is a sensitive field and must only be readable/writable by admins or verifiable through rules (not exposed to user).
6. Orders must be linked to a valid user phone number.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Spoofing:** Creating a user document with someone else's phone number as the ID but your own `authUid`.
2. **Device Jacking:** Updating `lastDeviceId` of an existing user without a valid `authCode`.
3. **Privilege Escalation:** Setting `role: 'admin'` during user registration.
4. **Point Injection:** Manually incrementing `points` in the user profile.
5. **Orphaned Orders:** Creating an order for a phone number that doesn't exist in the `users` collection.
6. **Shadow Fields:** Adding a `isVerified: true` field to bypass checks.
7. **Cross-User Leak:** Listing all users when not an admin.
8. **Code Guessing:** Rapidly trying different `authCode` values (Rate limiting isn't in rules, but we can prevent guessing by clearing code on fail if we had cloud functions, here we just ensure exact match).
9. **Terminal State Bypass:** Changing an order status from 'delivered' back to 'pending'.
10. **ID Poisoning:** Using a 1MB string as a document ID.
11. **Timestamp Faking:** Sending a `createdAt` from 2020.
12. **PII Scraping:** Getting a user profile's email/phone without being an admin or the owner.

## The Test Runner (firestore.rules.test.ts)
(This would be implemented if the environment supported running these tests easily, but I will focus on the rules implementation first).
