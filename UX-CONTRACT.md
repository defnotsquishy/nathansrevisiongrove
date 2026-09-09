# Revision Grove interaction contract

Business evidence: the owner requested GitHub Pages hosting, free account-based progress, admin roles, attribution and no sale of user data. Keep guest revision working. No paid plan, analytics, marketing email or advertising is enabled.

The profile shortcut opens Account. Revision-name edits use the existing plan save path and preserve all other settings and progress. Guest names save on the device; verified users save to their private cloud plan. This display name does not change the sign-in email or authentication username. Failed saves retain the draft and show a retry message. Brown and copper surfaces are shared across public and revision pages; confidence colours retain their red, amber and green meanings.

## Canonical UI Map

| Capability     | Canonical owner                            | Source of truth                              | Allowed variants                      | Verification                   |
| -------------- | ------------------------------------------ | -------------------------------------------- | ------------------------------------- | ------------------------------ |
| Select/Listbox | Picker in grove-app.tsx                    | Existing timetable + DESIGN.md               | native mobile select; Base UI desktop | keyboard and popup checks      |
| Date           | Input in existing timetable                | lib/model.ts                                 | browser-native date/time              | planner tests                  |
| Form           | components/ui/input.tsx + AccountPanel     | Firebase Auth + cloud validation             | sign-in, signup, reset, delete        | account browser tests          |
| Scrollbar      | app/globals.css                            | DESIGN.md                                    | document; bounded tables              | narrow viewport checks         |
| Toast          | GroveApp status output                     | confirmed save result                        | local save, cloud save                | persistence tests              |
| CRUD           | lib/cloud-client.ts + firestore.rules      | authenticated UID, current role and revision | own plan; owner role changes          | rules emulator + browser tests |
| Practice/RAG   | components/practice-hub.tsx + lib/model.ts | saved topic progress                         | quick question; topic-row rating      | unit + browser checks          |

## Account and data boundaries

Authentication is Firebase Auth, email/password with email verification required before cloud writes. Nicknames are not unique login identifiers. Email and passwords never enter Firestore. Passwords go only to the Firebase Authentication SDK. Session persistence is the default; Remember me opts into local auth persistence. No Firestore offline disk cache is enabled.

Guest data uses the existing device key. Cloud data is separate; uploading the guest plan is explicit and confirms replacement. Every plan request carries the expected authenticated UID; account changes remount application state and query caches. Failed cloud operations never fall back to writing another storage location. Newer revisions reject stale saves. Edits remain in open forms so retry is possible; export preserves the last saved plan; unsaved form edits must be copied before reloading. A role grant cannot provide access to another student's plan.

Practice questions authored in this repository may be shown on-page. Third-party questions and booklets remain on their provider's website and are linked with attribution. A RAG rating updates confidence and the next suggested review date; it does not create a session log, minutes or XP. Red schedules one day, amber three days and green seven days using the same heuristic as a completed session.

Member: own profile/plan only. Admin: username directory, no other students' plans/emails. Owner: directory plus grant/revoke admin to other existing accounts. Owner creation and transfer require Firebase console access. No first-user-is-admin bootstrap and no client-writable owner role. The static admin document is public shell only; database access is independently denied for unauthorized requests.

## States and confirmations

Forms use noValidate and text errors, preserve values on network failure and disable duplicate submit. Password fields allow paste/autofill and are masked by default. Delete requires current password reauthentication before deleting any cloud records; Cancel receives initial focus. Role changes and replacing a plan require an app-owned confirmation. Failed deletion explains retry; data deletion and Auth deletion are separate service operations and may require a retry after partial failure.

Account status starts loading, then guest/unverified/verified or an inline service error. Sign-out clears the account context; it does not erase separate guest data. An unavailable account service does not claim a successful cloud save. Admin lists fetch 25 at a time. No speculative search or bulk actions.

Account cleanup uses a Firestore transaction to retire the UID with an immutable deletion-time marker and remove profile, plan and role. Rules check the post-transaction marker to prevent recreation through old tokens or simultaneous writes. The privacy notice discloses this minimal retained security record. Retry can read the marker and repeat cleanup without changing it.

## Privacy and deployment

The public root is the homepage; the working Today view is dashboard/. Public informational pages do not initialize Firebase or read saved plans. The homepage geometry is illustrative and never changes actual progress. It pauses automatically outside the viewport and respects reduced motion. Revision pages always use quiet mode while keeping manual model controls. The opt-in walkthrough is illustrative and never changes actual progress. The thank-you page is project appreciation, not proof that an email or form was received. Contact copy aims for five working days with exam-period flexibility, chosen with the owner's authority. Use WebSite and educational WebApplication schema; no LocalBusiness claim applies to this student project.

Account activation requires valid public Firebase configuration and a public privacy contact. Missing setup leaves guest mode enabled and the account page honestly unavailable. The privacy notice describes the current activation state. Browser storage serves requested features; there is no optional tracking consent switch because no optional tracking exists.

GitHub Pages cannot set custom server response headers. CSP is delivered as a meta policy; it cannot enforce frame-ancestors. HTTPS is enforced by Pages. The cloud rules are deployed separately and must pass emulator tests before accounts open. Public Firebase configuration is not a server credential; IAM keys and service-account JSON never belong in the repository.
