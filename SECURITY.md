# Security boundaries

This is a static GitHub Pages application with optional Firebase Authentication and Firestore. Cloud accounts are disabled in the default configuration. Deploy `firestore.rules`, configure email verification and set a public privacy contact before enabling them; see [SETUP.md](SETUP.md).

## Data access

- Firestore denies unmatched requests. Verified users can save only their own plan. The browser supplies no trusted role or owner identity.
- Admins can read a bounded username directory and account roles. Only the owner can change another existing account between member and admin. Other students' plans remain inaccessible to both roles through the app's database API.
- Owner creation and transfer require privileged Firebase console access. Protect that access with two-factor authentication. Console operators and their server credentials can bypass Firestore rules; never publish those credentials.
- Cloud writes validate the local state and use transactions to reject stale revisions. Rules independently restrict document fields, sizes and revision increments. Plan contents are private, user-controlled JSON, not trusted server instructions or executable markup.
- Deletion reauthenticates before deleting data. Database cleanup and Auth deletion are separate operations; retry after a partial failure. Deleting Auth users manually in the Firebase console does not automatically delete their Firestore documents.
- Cleanup atomically writes an immutable `deletions/UID` marker containing only the deletion timestamp. Rules check post-transaction state to stop cached tokens, refresh callbacks and other tabs from recreating profiles or plans. No username, email or revision content is kept in this marker. It remains for this security purpose; do not remove it while old tokens might still be usable. Concurrent cleanup retries use a transaction.
- Firebase Auth stores passwords. App code never stores them in a plan, profile, log or backup. Remember me is optional; the default authentication session lasts in the current browser session. Separate guest progress survives sign-out.

## Browser and hosting

Pages include a Content Security Policy without unsafe-eval, restrictive resource origins, a referrer policy and escaped React output. GitHub Pages does not support custom response headers, so the meta CSP cannot enforce frame-ancestors. There are no analytics or advertising SDKs. Public Firebase web configuration is deliberately public; it is not an authorization boundary.

There is no application server to enforce custom per-user throttling. Firebase Auth protections, email enumeration protection, password policy and service quotas must be configured in the project. Free-plan quota exhaustion can temporarily prevent account or save operations; the UI reports failure and supports backups. Do not weaken database rules to resolve permission errors.

## Checks

Run `pnpm lint`, `pnpm typecheck`, `pnpm build` and `pnpm test`. With Java 21 installed, run `pnpm test:rules` to exercise real Firestore rules against a local demo emulator. These checks cover cross-user reads/writes, unverified accounts, role escalation, stale revisions, document limits, owner protection and deletion. They do not contact a live Firebase project.

For browser account tests, `node tests/build-emulator.mjs` creates a loopback-only fixture in `work/cloud-preview` and restores the original configuration. Run Auth on 9099 and Firestore on 8085 with project ID `demo-revision-grove`. Emulator builds are refused in publication CI. Always run a normal build afterward.

Report a suspected vulnerability through the repository's private vulnerability reporting option if enabled, or the public privacy contact once configured. Do not post passwords, tokens or student records in public issues. Tests are evidence of these boundaries, not a promise that the application is vulnerability-free.
