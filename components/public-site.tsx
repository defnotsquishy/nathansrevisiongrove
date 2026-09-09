'use client';

import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  ExternalLink,
  Leaf,
  LockKeyhole,
  Mail,
  Play,
  TreePine,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { CookiePolicy, Credits, PrivacyPolicy } from './legal-pages';
import { pageHref, pageInfo, type View } from '@/lib/pages';
import { cloudSettings } from '@/lib/cloud-config';

const IntroPlayer = lazy(() => import('./revision-intro'));
const HomeStage = lazy(() => import('./home-stage'));
export const isPublicView = (view: View) =>
  ['Home', 'Terms', 'Thank you', 'Privacy', 'Cookies', 'Credits'].includes(
    view,
  );
const faq = [
  [
    'Is Revision Grove free?',
    'Yes. The timetable, questions, topic ratings and progress tree are free. There are no adverts or paid upgrades.',
  ],
  [
    'Do I need an account?',
    'No. You can revise as a guest and save progress in this browser. An optional verified email account lets you save a plan across devices.',
  ],
  [
    'Which maths course does it cover?',
    'The topic map covers GCSE Higher Maths. Choose your exam board in plan settings. Check your course and tier with your teacher, particularly when using linked booklets.',
  ],
  [
    'Are the questions from First Class Maths?',
    'The quick questions on this site are original Revision Grove questions. First Class Maths videos, booklets and papers open on their official website and are credited to them.',
  ],
  [
    'What do red, amber and green mean?',
    'Red means you need to relearn the topic. Amber means you need another attempt. Green means you can do it independently. These are your own confidence ratings, not predicted grades.',
  ],
  [
    'What data is saved?',
    'Guest plans stay in your browser. Accounts use Firebase for sign-in and saved revision progress. There is no advertising or analytics tracking, and personal data is not sold.',
  ],
  [
    'Can I use it on my phone?',
    'Yes. The timetable and practice desk adapt to a smaller screen. Write your working on paper, then check the answer and save your confidence rating.',
  ],
];

class DemoBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="intro-fallback">
        The animation could not load. The steps below explain the same routine,
        and you can still open the practice desk.
      </p>
    ) : (
      this.props.children
    );
  }
}

export default function PublicSite({
  view,
  base,
}: {
  view: View;
  base: string;
}) {
  const href = (destination: View) => pageHref(destination, base);
  const [demo, setDemo] = useState(false);
  return (
    <div className="public-site">
      <header className="public-header public-container">
        <a
          className="public-brand"
          href={href('Home')}
          aria-label="Revision Grove home"
        >
          <Leaf aria-hidden="true" size={30} />
          <span>
            revision grove<span className="brand-byline">BY NATHAN YU</span>
          </span>
        </a>
        <nav aria-label="Main navigation" className="public-nav">
          <a href={`${href('Home')}#how-it-works`}>How it works</a>
          <a href={href('Practice')}>Practice</a>
          <a href={`${href('Home')}#faq`}>FAQ</a>
          <a className="public-button public-outline" href={href('Account')}>
            <LockKeyhole size={16} aria-hidden="true" /> Log in
          </a>
        </nav>
      </header>
      <main id="main-content" className="public-container">
        {view !== 'Home' && (
          <Breadcrumb className="public-breadcrumb">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={href('Home')}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{view}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
        {view === 'Home' ? (
          <>
            <section className="public-hero" aria-labelledby="home-title">
              <div className="hero-copy">
                <p className="public-kicker">
                  GCSE MATHS · YOUR OWN REVISION ROUTINE
                </p>
                <h1 id="home-title">
                  REVISION<span>GROVE</span>
                </h1>
                <p className="hero-description">
                  A timetable you can change, questions you can work through,
                  and a clear record of the topics to revisit. Built by Nathan
                  for his own revision and shared for yours.
                </p>
                <div className="public-actions">
                  <a className="public-button" href={href('Today')}>
                    Start revising <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a
                    className="public-button public-outline"
                    href={href('Account')}
                  >
                    Log in or create account
                  </a>
                </div>
                <p className="hero-note">
                  <Check size={16} aria-hidden="true" /> Free to use. Start
                  without an account.
                </p>
              </div>
              <div className="hero-model-wrap">
                <DemoBoundary>
                  <Suspense
                    fallback={
                      <div className="model-loading">
                        Loading the geometry preview…
                      </div>
                    }
                  >
                    <HomeStage />
                  </Suspense>
                </DemoBoundary>
              </div>
              <div className="hero-side-note">
                <span>MADE FOR GCSE MATHS</span>
                <h2>
                  Plan.
                  <br />
                  Practise.
                  <br />
                  Revisit.
                </h2>
                <a className="public-text-link" href={href('Maths lab')}>
                  Explore the maths lab <ArrowRight size={16} />
                </a>
              </div>
            </section>
            <div
              className="public-feature-strip"
              aria-label="Included features"
            >
              <span>
                <CalendarDays aria-hidden="true" /> Flexible timetable
              </span>
              <span>
                <BookOpen aria-hidden="true" /> Questions and methods
              </span>
              <span>
                <TreePine aria-hidden="true" /> A tree that grows with effort
              </span>
              <span>
                <Cloud aria-hidden="true" /> Optional cloud saves
              </span>
            </div>
            <section
              id="how-it-works"
              className="public-section routine-section"
              aria-labelledby="routine-title"
            >
              <div>
                <p className="public-kicker">ONE SESSION AT A TIME</p>
                <h2 id="routine-title">
                  Know what to do
                  <br />
                  when you sit down.
                </h2>
                <p>
                  Use this routine with the practice desk or an official First
                  Class Maths booklet. The rating is yours to choose after you
                  check your working.
                </p>
                <a className="public-text-link" href={href('Practice')}>
                  Open the practice desk <ArrowRight size={17} />
                </a>
              </div>
              <div className="routine-demo">
                <div className="demo-screen">
                  {demo ? (
                    <DemoBoundary>
                      <Suspense
                        fallback={
                          <output className="intro-fallback">
                            Loading the walkthrough…
                          </output>
                        }
                      >
                        <IntroPlayer />
                      </Suspense>
                    </DemoBoundary>
                  ) : (
                    <div className="demo-poster">
                      <span className="public-kicker">A WORKED EXAMPLE</span>
                      <p>4(3x − 5)</p>
                      <span>Expand. Check. Choose your next step.</span>
                      <button
                        className="public-button public-outline"
                        onClick={() => setDemo(true)}
                      >
                        <Play size={16} aria-hidden="true" /> Play 12-second
                        walkthrough
                      </button>
                    </div>
                  )}
                </div>
                <ol className="routine-steps">
                  <li>
                    <strong>Choose a topic</strong>
                    <span>Start with what needs another go.</span>
                  </li>
                  <li>
                    <strong>Try a question</strong>
                    <span>Keep the answer hidden while you work.</span>
                  </li>
                  <li>
                    <strong>Check and rate</strong>
                    <span>Red, amber or green sets a suggested revisit.</span>
                  </li>
                </ol>
              </div>
            </section>
            <section
              className="public-section added-section"
              aria-labelledby="added-title"
            >
              <div className="section-heading">
                <div>
                  <p className="public-kicker">WHAT YOU CAN USE TODAY</p>
                  <h2 id="added-title">From a plan to actual practice.</h2>
                </div>
                <a className="public-text-link" href={href('Today')}>
                  Explore the workspace <ArrowRight size={17} />
                </a>
              </div>
              <div className="feature-grid">
                <a href={href('Timetable')}>
                  <CalendarDays aria-hidden="true" />
                  <h3>A timetable that fits</h3>
                  <p>
                    Pick available days, session lengths and topics. Move
                    sessions as your week changes.
                  </p>
                  <span>
                    Build a timetable <ChevronRight size={17} />
                  </span>
                </a>
                <a href={href('Practice')}>
                  <BookOpen aria-hidden="true" />
                  <h3>Questions, then answers</h3>
                  <p>
                    Try 15 original quick questions with worked methods, plus
                    official booklet and paper links.
                  </p>
                  <span>
                    Try a question <ChevronRight size={17} />
                  </span>
                </a>
                <a href={href('Topic map')}>
                  <Check aria-hidden="true" />
                  <h3>Know what to revisit</h3>
                  <p>
                    Rate confidence across 106 Higher Maths topics. Red, amber
                    and green stay with your saved plan.
                  </p>
                  <span>
                    View the topics <ChevronRight size={17} />
                  </span>
                </a>
                <a href={href('My grove')}>
                  <TreePine aria-hidden="true" />
                  <h3>See the effort add up</h3>
                  <p>
                    Completed focus sessions grow your tree. Keep reflection
                    notes and explore shapes in the maths lab.
                  </p>
                  <span>
                    Open your grove <ChevronRight size={17} />
                  </span>
                </a>
              </div>
            </section>
            <section
              id="project-story"
              className="public-section project-story"
              aria-labelledby="story-title"
            >
              <div>
                <p className="public-kicker">PROJECT CASE STUDY</p>
                <h2 id="story-title">
                  A student project,
                  <br />
                  built around revision.
                </h2>
                <p>
                  Nathan’s Revision Grove began as a way to organise revision
                  videos and keep a record of study. A teacher’s question about
                  practice tasks helped shape the next step.
                </p>
                <p>
                  The focus now is simple: connect a revision plan to questions,
                  reflection and a useful next session.
                </p>
                <a
                  className="public-text-link"
                  href="https://github.com/defnotsquishy/nathansrevisiongrove"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the project source <ExternalLink size={16} />
                </a>
              </div>
              <ol className="project-timeline">
                <li>
                  <span>THE START</span>
                  <h3>Organise the resources</h3>
                  <p>
                    Topic videos and a revision timetable, with progress saved
                    in the browser.
                  </p>
                </li>
                <li>
                  <span>ADDED NEXT</span>
                  <h3>Keep progress across devices</h3>
                  <p>
                    Optional email accounts, cloud saves, backup controls and
                    clear privacy information.
                  </p>
                </li>
                <li>
                  <span>NOW AVAILABLE</span>
                  <h3>Make space for practice</h3>
                  <p>
                    On-page questions, worked methods, official booklets and RAG
                    confidence ratings.
                  </p>
                </li>
                <li>
                  <span>IDEAS FOR LATER</span>
                  <h3>More questions and 3D work</h3>
                  <p>
                    Possible next steps, guided by feedback. These are plans,
                    not features being promised today.
                  </p>
                </li>
              </ol>
            </section>
            <section
              id="faq"
              className="public-section faq-section"
              aria-labelledby="faq-title"
            >
              <div>
                <p className="public-kicker">BEFORE YOU START</p>
                <h2 id="faq-title">A few useful answers.</h2>
                <p>
                  For more detail, read the{' '}
                  <a href={href('Privacy')}>privacy policy</a> and{' '}
                  <a href={href('Terms')}>terms and conditions</a>.
                </p>
              </div>
              <div className="faq-list">
                {faq.map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      {question}
                      <ChevronRight size={18} aria-hidden="true" />
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
            <section
              className="public-section contact-section"
              aria-labelledby="contact-title"
            >
              <div>
                <p className="public-kicker">FEEDBACK & QUESTIONS</p>
                <h2 id="contact-title">Tell Nathan what would help.</h2>
                <p>
                  Found a confusing question or a problem with the site? Email
                  the topic or page and what happened. Please leave out
                  passwords and private student information.
                </p>
                <p className="response-promise">
                  I aim to reply within five working days. This is a student
                  project, so replies may take longer during exams.
                </p>
                <a
                  className="public-text-link"
                  href={`mailto:${cloudSettings.privacyEmail}`}
                >
                  <Mail size={18} /> {cloudSettings.privacyEmail}
                </a>
              </div>
              <div className="contact-cta">
                <h3>Ready for one question?</h3>
                <p>You can start now and make a plan afterwards.</p>
                <a className="public-button" href={href('Practice')}>
                  Start a practice question <ArrowRight size={18} />
                </a>
              </div>
            </section>
          </>
        ) : (
          <div className="public-document">
            <h1>{pageInfo[view].title}</h1>
            {view === 'Privacy' && <PrivacyPolicy />}
            {view === 'Cookies' && <CookiePolicy />}
            {view === 'Credits' && <Credits />}
            {view === 'Terms' && <Terms base={base} />}
            {view === 'Thank you' && (
              <section className="panel policy-page">
                <Leaf size={36} aria-hidden="true" />
                <h2>Thanks for giving it a go.</h2>
                <p>
                  Every bit of feedback helps Nathan decide what to improve
                  next. Thank you to First Class Maths for the linked resources
                  and to the teachers who have taken time to look at the
                  project.
                </p>
                <p>
                  If you have a question or suggestion, contact{' '}
                  <a href={`mailto:${cloudSettings.privacyEmail}`}>
                    {cloudSettings.privacyEmail}
                  </a>
                  .
                </p>
                <div className="public-actions">
                  <a className="public-button" href={href('Practice')}>
                    Try a question <ArrowRight size={17} />
                  </a>
                  <a
                    className="public-button public-outline"
                    href={href('Today')}
                  >
                    Open my dashboard
                  </a>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <footer className="public-footer public-container">
        <div>
          <a className="public-brand" href={href('Home')}>
            <Leaf size={23} aria-hidden="true" /> revision grove
          </a>
          <p>
            © {new Date().getFullYear()} Nathan Yu. Original website content and
            design.
          </p>
          <p>
            Resources by{' '}
            <a
              href="https://www.1stclassmaths.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              First Class Maths
            </a>
            . Independent student project, not affiliated or endorsed.
          </p>
        </div>
        <nav aria-label="Site information">
          <a href={href('Privacy')}>Privacy policy</a>
          <a href={href('Cookies')}>Cookies & storage</a>
          <a href={href('Terms')}>Terms & conditions</a>
          <a href={href('Credits')}>Credits</a>
          <a href={href('Thank you')}>Project thanks</a>
          <a href={href('Account')}>Account</a>
        </nav>
        <p className="storage-note">
          <LockKeyhole size={15} aria-hidden="true" /> Only storage used for
          your chosen features. No advertising or analytics trackers.
        </p>
      </footer>
    </div>
  );
}

function Terms({ base }: { base: string }) {
  return (
    <article className="panel policy-page">
      <p className="eyebrow">Last updated 8 September 2026</p>
      <h2>About this project</h2>
      <p>
        Nathan’s Revision Grove is a free, independent revision tool operated by
        Nathan Yu. It helps you plan and practise. It is not an exam board,
        school service or substitute for advice from your teacher, and it does
        not guarantee grades.
      </p>
      <h2>Using the website</h2>
      <p>
        You may use the timetable and original practice questions for your own
        study. Check questions and methods against your course requirements. If
        you notice an error, email Nathan so it can be reviewed. Do not disrupt
        the service, attempt to access someone else’s account, or upload
        unlawful or harmful content.
      </p>
      <h2>Accounts and saved progress</h2>
      <p>
        Keep your password private, use an email address you control and choose
        a nickname for your profile. You are responsible for activity under your
        account. If you need help understanding account choices, ask a parent,
        carer or teacher. Keep a downloaded backup of important revision plans.
        Browser data can be lost when site storage is cleared, and cloud
        services may occasionally be unavailable.
      </p>
      <h2>Your information</h2>
      <p>
        Personal data is not sold or used for advertising. Read the{' '}
        <a href={pageHref('Privacy', base)}>privacy policy</a> for what guest
        and account modes store, who can access it, and how to delete it. The{' '}
        <a href={pageHref('Cookies', base)}>cookies and storage page</a>{' '}
        explains storage used for the features you choose.
      </p>
      <h2>Resources and copyright</h2>
      <p>
        First Class Maths materials are linked from their original website.
        Their own terms and copyright apply. Linking or crediting a resource
        does not give permission to copy or republish it. Original website
        content and design belong to Nathan Yu, subject to third-party licences
        listed on the <a href={pageHref('Credits', base)}>credits page</a>.
      </p>
      <h2>Availability and changes</h2>
      <p>
        The project is still being developed. Features, questions and these
        terms may change, and availability cannot be guaranteed. The date above
        will change when these terms are updated. Nothing here limits any rights
        or responsibilities that cannot legally be excluded.
      </p>
      <h2>Contact</h2>
      <p>
        For questions about the site or these terms, email{' '}
        <a href={`mailto:${cloudSettings.privacyEmail}`}>
          {cloudSettings.privacyEmail}
        </a>
        . Nathan aims to reply within five working days, with possible delays
        during exams.
      </p>
    </article>
  );
}
