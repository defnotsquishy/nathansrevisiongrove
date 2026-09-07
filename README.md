# Nathan’s Revision Grove

[Open the app](https://defnotsquishy.github.io/nathansrevisiongrove/)

A GCSE revision timetable with 106 Higher Maths topics, First Class Maths links, a focus timer, confidence check-ins, custom subjects, a growing 3D tree and an interactive maths lab.

## Your progress

Guest progress stays in this browser on this device. Use **Back up or restore progress** to download a JSON backup before clearing browser data or switching devices. Restore previews the backup and requires confirmation before replacing the current plan. The original private Sites version has its own separate saved plan.

Firebase accounts are enabled and support verified email sign-in, password recovery, cloud progress, account deletion and limited admin roles. The backend uses the `nathans-revision-grove` Firebase project on the free Spark plan, with Firestore Standard in London. There are no ads, analytics or sales of user data. Read the website's Privacy, Cookies and Credits pages for details, or use `cheesehim21@gmail.com` for privacy and account questions.

Cloud plans belong to their signed-in user. Admins can view usernames and roles; only the owner can grant admin access. Admin roles do not grant access to other students' revision plans. Firestore rules enforce this independently of the browser. See [security boundaries and testing](SECURITY.md).

## Run and build

Use Node 24 and pnpm 11.19.0. Run 'pnpm install --frozen-lockfile', 'pnpm build', then 'pnpm preview'. Open http://127.0.0.1:4173/nathansrevisiongrove/. Run 'pnpm lint' and 'pnpm typecheck' for code checks.

Every route has a pre-rendered HTML document, unique title, description, H1, canonical URL and breadcrumbs. Source lives in components/, lib/ and pages/. Build output lives in dist-pages/. JavaScript enables editing, timers and models. The source and build contain no personal study records.

## GitHub Pages and your domain

The deployment workflow builds and publishes dist-pages/ from main. Configure Pages to use GitHub Actions. 'pages/site.json' controls the origin and base path. The free address uses base '/nathansrevisiongrove/'.

For a domain you own, set customDomain to its full hostname, origin to its HTTPS URL and base to '/'. Rebuild, add the same hostname in repository Settings → Pages, verify domain ownership and configure DNS as described in [GitHub’s domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). The build then generates CNAME and updates all URLs. No domain has been purchased or claimed by this project.

The custom 404 is a genuine missing-page response; unknown URLs do not silently load the dashboard. robots.txt and sitemap.xml are generated. On the free project URL, crawlers use the hostname-root robots.txt, not the project-subdirectory file. A connected custom domain gives this project its own root robots.txt.

## Performance and accessibility

The maths lab and 3D models load on demand. React and Three.js use separate cacheable bundles. CSS scans only components used by this app. Navigation works through real links. Models and graphs have accessible descriptions, controls have labels, motion respects system preferences and a Calm motion switch, and keyboard users have a skip link. The current UI uses SVG icons and canvas models rather than photographic images; meaningful visuals have text equivalents.

## Research and credits



1. **What helps revision stick?** Retrieval practice and spaced practice inform the focus prompt and due-topic list. The 1/3/7-day confidence gaps are adjustable product heuristics, not a scientifically optimal timetable. [The Learning Scientists](https://www.learningscientists.org/faq).
2. **What makes a timetable manageable?** Realistic sessions and regular breaks. Default sessions last 25 minutes, generated plans leave five-minute gaps, and the timer offers a five-minute break. [UCL revision guidance](https://www.ucl.ac.uk/study/current-students/exams-and-assessments/assessment-success-guide/effective-revision-and-assessment-planning).
3. **What should game mechanics reward?** The tree records effort with visible growth. Confidence is self-reported; XP does not predict grades or imply mastery. Rest days never remove earned tree growth. This is our design inference from a research review reporting motivational benefits but limited competency effects. [Gamification meta-analysis](https://link.springer.com/article/10.1007/s11423-023-10337-7).
4. **Which maths resources are useful?** Topic explanations, questions, solutions and past papers from [First Class Maths](https://www.1stclassmaths.com/). Topic names and video URLs are factual resource references from Nathan's original published list; videos may cover multiple related topics. No videos or worksheets are rehosted. The app is not affiliated with First Class Maths.
5. **How should animation stay comfortable?** Respect reduced-motion settings, add a clear motion switch, and preserve manual model controls. [W3C technique C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39).

Sources checked 5 September 2026. Tree and solid models are generated interactively with Three.js; Blender was not used.
