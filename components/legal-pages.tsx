import { cloudConfigured, cloudSettings } from '@/lib/cloud-config';
export function Credits() {
  return (
    <section className="panel policy-page">
      <h2>Made by Nathan</h2>
      <p>
        © 2026 Nathan Yu / Nathan’s Revision Grove. All rights reserved in the
        original website content and design, subject to the licences of the
        libraries used to build it.
      </p>
      <h2>First Class Maths</h2>
      <p>
        Maths videos, practice questions, exam papers and worked solutions
        linked from this site are provided by{' '}
        <a
          href="https://www.1stclassmaths.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          First Class Maths
        </a>{' '}
        and other credited resource owners. Their materials, names and branding
        remain the property of their respective owners.
      </p>
      <p>
        Thank you to First Class Maths for making these revision resources
        available. Revision Grove links to the originals; it does not claim
        ownership of or rehost their videos and worksheets. Credit is not
        permission to copy their materials.
      </p>
      <p>
        This is an independent student project. It is not affiliated with,
        sponsored by or endorsed by First Class Maths, any exam board or the
        school.
      </p>
      <h2>Software credits</h2>
      <p>
        The app uses React, Three.js, Firebase, Base UI, shadcn/ui, Lucide,
        TanStack Query and other open-source libraries under their own licences.
        Bundled third-party licence information remains in the source
        dependencies.
      </p>
      <p>
        <a href="https://github.com/defnotsquishy/nathansrevisiongrove">
          View the project source and dependencies
        </a>
      </p>
    </section>
  );
}
export function PrivacyPolicy() {
  return (
    <article className="panel policy-page">
      <p className="eyebrow">Last updated 6 September 2026</p>
      <h2>Your revision is yours</h2>
      <p>
        Nathan’s Revision Grove is operated by Nathan Yu. We do not sell your
        data, use it for advertising or add analytics trackers. You can use the
        timetable without creating an account.
      </p>
      <p className="account-notice">
        {cloudConfigured
          ? 'Cloud accounts are enabled. Signing in lets you save progress across devices.'
          : 'Cloud accounts are not enabled yet. Your guest revision progress currently stays in this browser.'}
      </p>
      <h2>What the app stores</h2>
      <ul>
        <li>
          <strong>Without an account:</strong> your chosen name, timetable,
          custom topics, session history, confidence ratings, reflection notes
          and motion preference stay in your browser. Downloaded backups stay
          wherever you save them.
        </li>
        <li>
          <strong>With an account, when enabled:</strong> Firebase
          Authentication handles your email, password authentication and sign-in
          session. The database stores a username, account creation time, any
          admin role, and the revision plan you save online. The app never
          stores your raw password in its database or shows it to admins.
        </li>
        <li>
          <strong>Service records:</strong> GitHub and Firebase may process IP
          addresses, device information and security logs to deliver and protect
          their services. Their own privacy terms apply to that processing.
        </li>
      </ul>
      <h2>Why it is used</h2>
      <p>
        Account details are used to sign you in, verify your email, recover
        access and keep your progress available on your devices. Revision data
        is used to show your timetable, tree, journal and review suggestions.
        Account and security records help prevent misuse. We do not ask for your
        school, address, date of birth or phone number.
      </p>
      <p>
        Use a nickname. Avoid putting sensitive information about yourself or
        anyone else in reflection notes or custom topics.
      </p>
      <h2>Who can access it</h2>
      <p>
        Other students cannot see your cloud plan. In-app admins can see
        usernames and roles; they cannot read other students’ plans, emails or
        reflection notes through the admin page. The site owner and authorised
        database operators have technical access needed to run the service.
        Firebase processes cloud account data; GitHub Pages delivers this
        website.
      </p>
      <p>
        Data may be processed outside the UK under the providers’ applicable
        data-protection arrangements. See{' '}
        <a
          href="https://firebase.google.com/support/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Firebase’s privacy information
        </a>{' '}
        and{' '}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub’s privacy statement
        </a>
        .
      </p>
      <h2>Your choices and deletion</h2>
      <p>
        Cloud progress is kept until you delete your account or ask the owner to
        remove it. Account provides a download and a permanent deletion control.
        Deletion removes your revision plan, username, role and sign-in account.
        A security marker containing only the retired account ID and deletion
        time is retained to prevent old sessions from recreating deleted
        records. It contains no email, username or revision content. Providers
        may retain limited security or backup records according to their own
        policies. If deletion fails, the page tells you and you can retry.
      </p>
      <p>
        Guest data remains until you clear it from your browser. Signing out
        removes the active sign-in session but does not delete the separate
        guest plan or downloaded backups. If you choose “Remember me”, the
        sign-in session can remain on that device until you sign out or clear
        site data. Otherwise it is limited to the browser session.
      </p>
      <p>
        You can request access, correction, deletion or other applicable data
        rights. If you are a student and anything here is unclear, ask a parent,
        carer or teacher to help.
      </p>
      <h2>Questions or concerns</h2>
      {cloudSettings.privacyEmail ? (
        <p>
          Contact{' '}
          <a href={'mailto:' + cloudSettings.privacyEmail}>
            {cloudSettings.privacyEmail}
          </a>{' '}
          with account or privacy questions. Never send your password.
        </p>
      ) : (
        <p>
          A direct privacy contact will be published before cloud accounts open.
          For now, guest progress can be downloaded or removed using your
          browser’s site-data controls. Do not post personal information in
          public GitHub issues.
        </p>
      )}
      <p>
        You can also raise a concern with the{' '}
        <a
          href="https://ico.org.uk/make-a-complaint/"
          target="_blank"
          rel="noopener noreferrer"
        >
          UK Information Commissioner’s Office
        </a>
        .
      </p>
    </article>
  );
}
export function CookiePolicy() {
  return (
    <article className="panel policy-page">
      <p className="eyebrow">Last updated 6 September 2026</p>
      <h2>No advertising or analytics cookies</h2>
      <p>
        Revision Grove uses browser storage to provide features you choose, such
        as saving a timetable, signing in and remembering reduced motion. There
        are no advertising trackers or analytics integrations, and no “accept
        all” button for optional tracking.
      </p>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Storage</th>
              <th scope="col">What it does</th>
              <th scope="col">How long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>revision-grove-plan-v1</td>
              <td>Guest timetable, topics and progress on this device</td>
              <td>Until cleared from site data</td>
            </tr>
            <tr>
              <td>grove-quiet</td>
              <td>Your chosen motion setting</td>
              <td>Until cleared from site data</td>
            </tr>
            <tr>
              <td>Firebase sign-in storage, when accounts are enabled</td>
              <td>
                Authenticates your account; session storage by default,
                persistent browser storage if you choose “Remember me”
              </td>
              <td>
                Session, or until sign-out/site-data removal for remembered
                sign-in; tokens are renewed while valid
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>You are in control</h2>
      <p>
        Download a progress backup before clearing site data. Clearing storage
        may remove your guest plan and sign you out. It does not delete your
        cloud account; use Account for that.
      </p>
      <h2>External links</h2>
      <p>
        Videos and worksheets open on their provider’s website. We do not embed
        YouTube players or advertising scripts. When you follow a link, that
        website may use its own cookies and privacy choices.
      </p>
      <h2>If this changes</h2>
      <p>
        If optional tracking is introduced in the future, the policy and
        controls must be updated before it is used. Your current revision app
        does not need optional tracking.
      </p>
    </article>
  );
}
