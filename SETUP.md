# Turn on free accounts and cloud progress

The updated website works in guest mode now. Cloud accounts remain switched off until the steps below are complete. Use Firebase's **Spark (no-cost)** plan. Do not enable Analytics, upgrade to Blaze or add a payment method for this app.

## 1. Create the project

Open [Firebase Console](https://console.firebase.google.com/) and choose **Create a project**. Use a name such as Nathan's Revision Grove. Turn Google Analytics off. The app needs only Authentication and Cloud Firestore.

## 2. Turn on email accounts

In **Build → Authentication → Get started → Sign-in method**, enable **Email/Password**. In Authentication settings add **defnotsquishy.github.io** to **Authorized domains**. Set the password policy to a minimum of **12 characters**, enable email-enumeration protection if available, and keep Google's abuse/rate protections enabled. Do not disable email verification: the app and database require it for cloud saving. Keep the default Firebase email action handler; custom SMTP is not needed.

## 3. Create the database and paste the rules

In **Build → Firestore Database**, create the **default Standard edition** database in **production mode**. Pick a suitable UK/European location before creation; this choice is not easily changed. Open its **Rules** tab, replace the starter rules with the complete [firestore.rules](firestore.rules) file from this repository and click **Publish**. Never select public/test rules for the live database.

## 4. Copy the public web configuration

In **Project settings → General → Your apps**, add a **Web app** (`</>`). Firebase Hosting is not required because the site uses GitHub Pages. Copy the firebaseConfig object. These four values are needed: apiKey, authDomain, projectId and appId. Do not copy a service-account JSON file, private key or admin credential.

Send that public configuration and your chosen public privacy email to Codex, and it can finish the connection. Alternatively edit [pages/cloud.json](pages/cloud.json) in GitHub: paste those four values under firebase, fill privacyEmail, then set enabled to true. Commit the change. The existing GitHub workflow rebuilds and publishes automatically. Extra Analytics configuration is not needed.

Before making accounts available to classmates, check the privacy notice with the responsible school/adult contact and make sure the published contact works. Restrict the Firebase web API key to the APIs Firebase needs; keep authorized domains narrow. Protect your Firebase/Google and GitHub administrator accounts with two-factor authentication. See [Firebase's API key guidance](https://firebase.google.com/docs/projects/api-keys).

## 5. Make your account the owner

Create your account on the website, verify its email and sign in. Copy its **User UID** from **Authentication → Users**. In Firestore's **Data** tab create the collection **access**, then a document whose ID is exactly that UID. Give it one **string** field: **role = owner**. Only do this for your own verified account.

Sign out and back in on the website. **Admin** appears in the navigation. You can now grant or revoke admin roles for other registered users after confirming each change. Admins see usernames and roles, not private revision notes or email addresses. Only the Firebase console can create or transfer an owner.

## Check it once

Create a second test account, verify its email, save a timetable, sign out and sign in on another browser. Its progress should return. Confirm the second account cannot open the admin directory. Download a backup, check that it contains the expected plan, and try account deletion with a disposable test account. Do not change production rules just to get a test to pass.

Cloud account deletion removes app records and the Firebase sign-in user. Operators who delete a user directly in Firebase Authentication must also delete plans/UID, profiles/UID and access/UID in Firestore; this app does not use a paid background function to do that automatically.

## Free-plan limits

Firebase's [Spark plan](https://firebase.google.com/pricing) has quotas, including database operations and email sends. If a free limit is reached, cloud operations can fail until capacity resets; the app shows a failed-save message rather than claiming success. Stay on Spark to avoid usage billing. Backups are still useful. No database plan is unlimited, and this is not a claim of guaranteed uptime.

For maintainers, run **pnpm test:rules** with Java 21 to test server authorization using local Firebase emulators. Deploy rules with **pnpm exec firebase deploy --only firestore:rules --project YOUR_PROJECT_ID** only after reviewing them; the GitHub Pages workflow does not receive a privileged Firebase deployment key.
