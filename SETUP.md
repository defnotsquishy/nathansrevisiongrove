# Manage free accounts and cloud progress

Cloud accounts are connected to the existing **nathans-revision-grove** Firebase project on the **Spark (no-cost)** plan. Email/password Authentication, Firestore rules and the public web configuration are deployed. The database is the default Standard edition database in London (`europe-west2`) with deletion protection. Analytics is not used. Keep the project on Spark unless the owner deliberately chooses a paid plan.

## 1. Project — complete

The project is already created. Its ID is **nathans-revision-grove**. The app needs only Authentication and Cloud Firestore.

## 2. Email accounts — complete

Email/password is enabled, **defnotsquishy.github.io** is authorized, the minimum password length is 12 characters and improved email privacy is enabled. Do not disable email verification: the app and database require it for cloud saving. Keep the default Firebase email action handler; custom SMTP is not needed.

## 3. Database and rules — complete

The **default Standard edition** database is deployed in London (`europe-west2`). The complete [firestore.rules](firestore.rules) file and [firestore.indexes.json](firestore.indexes.json) are deployed. Never replace them with public/test rules on the live database.

## 4. Web configuration — complete

The registered Firebase web app is connected in [pages/cloud.json](pages/cloud.json), and `nathan.yu2010@outlook.com` is the published privacy contact. Firebase Hosting is not required because the site uses GitHub Pages. This file contains only Firebase's public web configuration; never add a service-account JSON file, private key or administrator credential.

Before making accounts available to classmates, check the privacy notice with the responsible school/adult contact and make sure the published contact works. Restrict the Firebase web API key to the APIs Firebase needs; keep authorized domains narrow. Protect your Firebase/Google and GitHub administrator accounts with two-factor authentication. See [Firebase's API key guidance](https://firebase.google.com/docs/projects/api-keys).

## 5. Make your account the owner

Create your account on the website, verify its email and sign in. Copy its **User UID** from **Authentication → Users**. In Firestore's **Data** tab create the collection **access**, then a document whose ID is exactly that UID. Give it one **string** field: **role = owner**. Only do this for your own verified account.

Sign out and back in on the website. **Admin** appears in the navigation. You can now grant or revoke admin roles for other registered users after confirming each change. Admins see usernames and roles, not private revision notes or email addresses. Only the Firebase console can create or transfer an owner.

## Check it once

Create a second test account, verify its email, save a timetable, sign out and sign in on another browser. Its progress should return. Confirm the second account cannot open the admin directory. Download a backup, check that it contains the expected plan, and try account deletion with a disposable test account. Do not change production rules just to get a test to pass.

Cloud account deletion removes the plan, username, role and Firebase sign-in user. It retains a minimal deletions/UID marker with the deletion time, preventing still-valid old sessions from recreating the records. Operators who delete a user directly in Firebase Authentication must also delete plans/UID, profiles/UID and access/UID in Firestore and retain the same deletion marker; this app does not use a paid background function to do that automatically.

## Free-plan limits

Firebase's [Spark plan](https://firebase.google.com/pricing) has quotas, including database operations and email sends. If a free limit is reached, cloud operations can fail until capacity resets; the app shows a failed-save message rather than claiming success. Stay on Spark to avoid usage billing. Backups are still useful. No database plan is unlimited, and this is not a claim of guaranteed uptime.

For maintainers, run **pnpm test:rules** with Java 21 to test server authorization using local Firebase emulators. Deploy rules with **pnpm exec firebase deploy --only firestore:rules --project YOUR_PROJECT_ID** only after reviewing them; the GitHub Pages workflow does not receive a privileged Firebase deployment key.
