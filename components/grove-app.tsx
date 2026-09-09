'use client';
import {
  useState,
  useEffect,
  useMemo,
  lazy,
  Suspense,
  type CSSProperties,
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Download,
  ExternalLink,
  Flame,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  LoaderCircle,
  Map,
  Maximize2,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  Sprout,
  Target,
  TreePine,
  X,
  Zap,
  HelpCircle,
  RefreshCw,
  Pencil,
  Trash2,
  CloudCheck,
  NotebookPen,
} from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { pageInfo, pageHref, type View } from '@/lib/pages';
import { CloudProvider, useCloud } from './cloud-provider';
import { PrivacyPolicy, CookiePolicy, Credits } from './legal-pages';
const AccountPanel = lazy(() => import('./account-panel'));
const AdminPanel = lazy(() => import('./admin-panel'));
import {
  readDevicePlan,
  writeDevicePlan,
  restoreDevicePlan,
  exportBackup,
  readBackup,
} from '@/lib/device-storage';
const GroveScene = lazy(() => import('./grove-scene'));
const MathsLab = lazy(() => import('./maths-lab'));
const PracticeHub = lazy(() => import('./practice-hub'));
import {
  addDays,
  categories,
  colours,
  dueTopics,
  emptyState,
  finishSession,
  localDate,
  makePlan,
  monday,
  overlaps,
  rateTopic,
  sessionFor,
  settingsSchema,
  sessionSchema,
  streak,
  timeString,
  toMinutes,
  topicList,
  topics,
  type AppState,
  type Session,
  type Settings,
  type Topic,
} from '@/lib/model';

type Saved = { state: AppState; revision: number };
const navigation = [
  { name: 'Today', icon: LayoutDashboard },
  { name: 'Timetable', icon: CalendarDays },
  { name: 'Topic map', icon: Map },
  { name: 'Practice', icon: NotebookPen },
  { name: 'My grove', icon: TreePine },
  { name: 'Maths lab', icon: FlaskConical },
  { name: 'Resources', icon: BookOpen },
  { name: 'Sources', icon: HelpCircle },
  { name: 'Account', icon: CloudCheck },
] as const;
const formatDate = (
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) => new Date(date + 'T12:00:00').toLocaleDateString('en-GB', options);
function categoryColour(t: Topic) {
  return colours[categories.indexOf(t.category)];
}
function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger aria-label={label} className="picker">
        <SelectValue>
          {options.find((o) => o.value === value)?.label || value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function NavItems({
  view,
  setView,
  pagesBase,
}: {
  view: View;
  setView: (v: View) => void;
  pagesBase?: string;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenu>
      {navigation.map((n) => (
        <SidebarMenuItem key={n.name}>
          <SidebarMenuButton
            className="nav-item"
            isActive={view === n.name}
            render={
              pagesBase ? (
                <a
                  aria-label={n.name}
                  href={pageHref(n.name, pagesBase)}
                  aria-current={view === n.name ? 'page' : undefined}
                />
              ) : undefined
            }
            onClick={() => {
              if (!pagesBase) setView(n.name);
              setOpenMobile(false);
            }}
          >
            <n.icon size={19} />
            <span>{n.name}</span>
            {n.name === 'Maths lab' && <em>NEW</em>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
export default function GroveApp({
  initialView = 'Today',
  pagesBase,
}: { initialView?: View; pagesBase?: string } = {}) {
  return (
    <CloudProvider>
      <AccountWorkspace initialView={initialView} pagesBase={pagesBase} />
    </CloudProvider>
  );
}
function AccountWorkspace(props: { initialView: View; pagesBase?: string }) {
  const cloud = useCloud();
  // Remount caches, dialogs and timers on identity changes so no user's data
  // or in-flight mutation can become another user's plan.
  const identity = cloud.user?.verified ? cloud.user.uid : 'guest';
  return <SessionWorkspace key={identity} {...props} />;
}
function SessionWorkspace({
  initialView,
  pagesBase,
}: {
  initialView: View;
  pagesBase?: string;
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <App initialView={initialView} pagesBase={pagesBase} />
    </QueryClientProvider>
  );
}
function App({
  initialView,
  pagesBase,
}: {
  initialView: View;
  pagesBase?: string;
}) {
  const cloud = useCloud();
  const onlineAccount = Boolean(cloud.user?.verified);
  const cache = useQueryClient();
  const [view, setViewState] = useState<View>(initialView);
  const setView = (next: View) => {
    if (pagesBase) window.location.assign(pageHref(next, pagesBase));
    else setViewState(next);
  };
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupPreview, setBackupPreview] = useState<AppState | null>(null);
  const [backupError, setBackupError] = useState('');
  const [planOpen, setPlanOpen] = useState(false);
  const [edit, setEdit] = useState<Session | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [help, setHelp] = useState(false);
  const quiet = true;
  const [toast, setToast] = useState('');
  const [today, setToday] = useState(localDate());
  const [tint, setTint] = useState('#b8f78b');
  useEffect(() => {
    const interval = setInterval(() => setToday(localDate()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('quiet', quiet);
  }, [quiet]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  const query = useQuery<Saved>({
    queryKey: ['plan'],
    queryFn: async () => {
      if (onlineAccount && cloud.runtime)
        return cloud.runtime.readPlan(cloud.user!.uid);
      if (pagesBase) return readDevicePlan();
      const r = await fetch('/api/state');
      const body = (await r.json()) as Saved & { error?: string };
      if (!r.ok) throw new Error(body.error);
      return body;
    },
    retry: 1,
    enabled: !cloud.loading && !cloud.error,
    refetchOnWindowFocus: false,
  });
  const mutation = useMutation({
    mutationFn: async (state: AppState) => {
      const current = cache.getQueryData<Saved>(['plan']);
      if (onlineAccount && cloud.runtime)
        return cloud.runtime.writePlan(
          state,
          current?.revision ?? 0,
          cloud.user!.uid,
        );
      if (pagesBase) return writeDevicePlan(state, current?.revision ?? 0);
      const r = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, revision: current?.revision ?? 0 }),
      });
      const body = (await r.json()) as Saved & { error?: string };
      if (!r.ok) throw new Error(body.error);
      return body as Saved;
    },
    onSuccess: (data) => cache.setQueryData(['plan'], data),
  });
  const state = query.data?.state ?? emptyState(today);
  const all = useMemo(() => topicList(state), [state]);
  const getTopic = (id: string) => all.find((t) => t.id === id) ?? topics[0];
  const ready =
    !!query.data && !mutation.isPending && !cloud.loading && !cloud.error;
  async function save(next: AppState, message = 'Saved to your grove') {
    try {
      await mutation.mutateAsync(next);
      setToast(message);
      return true;
    } catch {
      return false;
    }
  }
  const logs = state.logs,
    completed = logs.length,
    xp = completed * 25,
    level = Math.floor(completed / 5) + 1,
    solid = Object.values(state.progress).filter(
      (p) => p.confidence === 3,
    ).length;
  const due = dueTopics(state, today);
  const scheduled = state.sessions
    .filter((s) => s.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const next = scheduled.find((s) => !s.done);
  const suggested = due[0] ?? all.find((t) => !state.progress[t.id]) ?? all[0];
  const focusTopic = next ? getTopic(next.topicId) : suggested;
  function start(s?: Session) {
    if (active) {
      setToast('Finish or leave your current session first.');
      return;
    }
    setActive(s ?? sessionFor(focusTopic.id, state.settings.minutes));
  }
  const hours = (logs.reduce((n, l) => n + l.minutes, 0) / 60).toFixed(1);
  const onPlan = async (settings: Settings) => {
    const result = makePlan(state, settings, today);
    if (
      await save(
        { ...state, settings, sessions: result.sessions },
        result.unplaced
          ? `Plan saved. ${result.unplaced} topics need more time — extend your plan or add sessions.`
          : 'Your timetable is ready.',
      )
    )
      setPlanOpen(false);
  };
  return (
    <SidebarProvider style={{ '--sidebar-width': '224px' } as CSSProperties}>
      <div className={`grove-app ${quiet ? 'quiet' : ''}`}>
        <Sidebar className="app-sidebar">
          <SidebarHeader>
            <button
              className="brand"
              onClick={() => setView('Today')}
              aria-label="Nathan's Revision Grove home"
            >
              <span className="brand-mark">
                <Sprout size={24} />
              </span>
              <span>
                revision
                <span className="brand-bottom">
                  grove<span className="brand-dot">.</span>
                </span>
              </span>
            </button>
            <div className="owner-label">GCSE REVISION WORKSPACE</div>
          </SidebarHeader>
          <SidebarContent>
            <NavItems view={view} setView={setView} pagesBase={pagesBase} />
            {(cloud.role === 'admin' || cloud.role === 'owner') && (
              <a
                className="nav-item admin-nav"
                href={pageHref('Admin', pagesBase || '/')}
              >
                Admin
              </a>
            )}
            <div className="side-note">
              <span className="eyebrow">YOUR NEXT MILESTONE</span>
              <span className="milestone-icon">
                <Sprout size={24} />
              </span>
              <strong>{5 - (completed % 5)} sessions to grow</strong>
              <p>
                {
                  [
                    'A sapling today. A canopy soon.',
                    'Your roots are getting stronger.',
                    'Give your next branch some light.',
                  ][Math.min(2, Math.floor(completed / 5))]
                }
              </p>
              <Progress
                value={((completed % 5) / 5) * 100}
                aria-label="Next growth milestone"
              />
            </div>
          </SidebarContent>
          <SidebarFooter>
            <button className="sidebar-help" onClick={() => setHelp(true)}>
              <HelpCircle size={17} /> Behind the tools
            </button>
            <div className="profile">
              <span>{state.settings.name.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{state.settings.name}</strong>
                <small>
                  Level {level} ·{' '}
                  {completed < 5 ? 'Seedling' : 'Growing strong'}
                </small>
              </div>
              <button
                aria-label="Edit profile"
                onClick={() => setView('Account')}
              >
                <Settings2 size={17} />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <SidebarTrigger className="mobile-menu" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={pagesBase ?? '#'}
                      onClick={
                        pagesBase
                          ? undefined
                          : (e) => {
                              e.preventDefault();
                              setView('Today');
                            }
                      }
                    >
                      Revision Grove
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{view}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="topbar-right">
              <span className="saved-label">
                <CloudCheck size={15} />
                {mutation.isPending
                  ? 'Saving…'
                  : query.isError || mutation.isError
                    ? 'Not synced'
                    : pagesBase
                      ? onlineAccount
                        ? 'Saved to your account'
                        : cloud.loading
                          ? 'Checking account…'
                          : 'Saved on this device'
                      : 'Saved online'}
              </span>
              <span className="streak-pill">
                <Flame size={16} /> {streak(state, today)} day streak
              </span>
              <button
                className="profile-shortcut"
                onClick={() => setView('Account')}
                aria-label="Open profile and account"
              >
                <span className="avatar" aria-hidden="true">
                  {state.settings.name.charAt(0).toUpperCase()}
                </span>
                <span>Profile</span>
              </button>
            </div>
          </header>
          <main className="main-content" id="main-content" tabIndex={-1}>
            {cloud.error && (
              <p className="error-banner" role="alert">
                {cloud.error}{' '}
                <a href={pageHref('Account', pagesBase || '/')}>Open Account</a>
              </p>
            )}
            {cloud.user && !cloud.user.verified && (
              <p className="account-notice">
                Verify your email in{' '}
                <a href={pageHref('Account', pagesBase || '/')}>Account</a> to
                enable cloud saving. Current changes save on this device.
              </p>
            )}
            {(query.isError || mutation.isError) && (
              <div className="error-banner" role="alert">
                <span>{(mutation.error ?? query.error)?.message}</span>
                <button
                  onClick={() => {
                    mutation.reset();
                    void query.refetch();
                  }}
                >
                  Reload saved plan
                </button>
              </div>
            )}
            {query.isLoading && (
              <output className="loading-line">
                <LoaderCircle className="spin" size={16} /> Loading your saved
                progress…
              </output>
            )}
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {formatDate(today, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </div>
                <h1>
                  {pagesBase
                    ? pageInfo[view].title
                    : view === 'Today'
                      ? `Hey ${state.settings.name}, let’s grow.`
                      : view === 'My grove'
                        ? 'Look how far you’ve come.'
                        : view === 'Topic map'
                          ? 'Find your next lightbulb moment.'
                          : view === 'Maths lab'
                            ? 'Make the maths move.'
                            : view === 'Resources'
                              ? 'The good stuff, all in one place.'
                              : 'A plan that fits your week.'}
                </h1>
                <p>
                  {view === 'Today'
                    ? 'Small sessions. Real progress. Your next step is right here.'
                    : view === 'Timetable'
                      ? 'Make room for revision. Leave room for everything else.'
                      : view === 'Topic map'
                        ? `${topics.length} GCSE Higher Maths topics, plus any subjects you add.`
                        : view === 'My grove'
                          ? 'Every completed session gives your tree a little more life.'
                          : view === 'Maths lab'
                            ? 'Change a value. See what happens. Then try explaining why.'
                            : view === 'Practice'
                              ? pageInfo.Practice.description
                              : [
                                    'Account',
                                    'Admin',
                                    'Privacy',
                                    'Cookies',
                                    'Credits',
                                  ].includes(view)
                                ? pageInfo[view].description
                                : view === 'Sources'
                                  ? 'The evidence and resource credits behind the tools.'
                                  : 'First Class Maths videos, questions and worked solutions.'}
                </p>
              </div>
              {![
                'Account',
                'Admin',
                'Privacy',
                'Cookies',
                'Credits',
                'Practice',
              ].includes(view) && (
                <button
                  className="button primary"
                  disabled={!ready}
                  onClick={() => setPlanOpen(true)}
                >
                  <CalendarDays size={17} />
                  {state.sessions.length ? 'Edit my plan' : 'Build my plan'}
                </button>
              )}
            </div>
            {view === 'Today' && (
              <>
                <section className="dashboard-top">
                  <div className="tree-card">
                    <div className="tree-card-heading">
                      <span className="eyebrow">
                        <span className="live-dot" /> YOUR REVISION GROVE
                      </span>
                      <button
                        className="icon-button"
                        onClick={() => setView('My grove')}
                        aria-label="Explore your grove"
                      >
                        <Maximize2 size={17} />
                      </button>
                    </div>
                    <div className="tree-copy">
                      <span className="level-pill">LEVEL {level}</span>
                      <h2>
                        {completed < 5
                          ? 'Room to grow.'
                          : completed < 20
                            ? 'Putting down roots.'
                            : 'Branching out.'}
                      </h2>
                      <p>
                        {completed === 0
                          ? 'Your first session starts the story.'
                          : `${completed} sessions planted. Keep it going.`}
                      </p>
                    </div>
                    <Suspense
                      fallback={
                        <div className="model-loading">Growing your scene…</div>
                      }
                    >
                      <GroveScene count={completed} quiet={quiet} tint={tint} />
                    </Suspense>
                    <div className="tree-footer">
                      <span>
                        <Leaf size={15} />{' '}
                        {completed < 5
                          ? 'Seedling'
                          : completed < 20
                            ? 'Young tree'
                            : 'Flourishing tree'}
                      </span>
                      <span>
                        {xp} XP{' '}
                        <span className="subtle">
                          / {(Math.floor(completed / 5) + 1) * 125} XP
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={((completed % 5) / 5) * 100}
                      aria-label="Tree experience"
                      className="tree-progress"
                    />
                  </div>
                  <div className="next-card">
                    <div className="eyebrow">
                      <span className="pulse-dot" />{' '}
                      {next
                        ? 'UP NEXT'
                        : due.length
                          ? 'READY FOR A REVISIT'
                          : 'YOUR FIRST STEP'}
                    </div>
                    <span
                      className="topic-symbol"
                      style={{ color: categoryColour(focusTopic) }}
                    >
                      {focusTopic.category === 'Algebra' ? 'ƒ(x)' : '∑'}
                    </span>
                    <span
                      className="subject-label"
                      style={{ color: categoryColour(focusTopic) }}
                    >
                      {focusTopic.category} <span>· GCSE Maths</span>
                    </span>
                    <h2>{focusTopic.title}</h2>
                    <p>
                      Try a few questions from memory, then check where you got
                      stuck.
                    </p>
                    <div className="session-meta">
                      <span>
                        <Clock3 size={15} />
                        {next?.minutes ?? state.settings.minutes} min
                      </span>
                      <span>
                        <Zap size={15} />
                        +25 XP
                      </span>
                    </div>
                    <button
                      className="button primary focus-start"
                      disabled={!ready}
                      onClick={() => start(next)}
                    >
                      <Play size={17} fill="currentColor" />
                      Start focus session
                      <ArrowUpRight size={18} />
                    </button>
                    {focusTopic.video && (
                      <a
                        className="video-shortcut"
                        href={focusTopic.video}
                        target="_blank"
                        rel="noreferrer"
                      >
                        First Class Maths video
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </section>
                <section className="stats-row">
                  <Stat
                    label="Sessions completed"
                    value={String(completed)}
                    icon={<CheckCheck />}
                    detail="Every session counts"
                  />
                  <Stat
                    label="Time focused"
                    value={`${hours}`}
                    unit="hrs"
                    icon={<Clock3 />}
                    detail="Time you’ve logged"
                  />
                  <Stat
                    label="Feeling confident"
                    value={`${solid}`}
                    unit={`/ ${all.length}`}
                    icon={<Target />}
                    detail="Based on your check-ins"
                  />
                  <Stat
                    label="Ready to revisit"
                    value={String(due.length)}
                    icon={<RefreshCw />}
                    detail={
                      due.length
                        ? 'Keep those memories fresh'
                        : 'No reviews waiting'
                    }
                    onClick={() => setView('Topic map')}
                  />
                </section>
                <section className="lower-grid">
                  <div className="panel today-sessions">
                    <div className="section-title">
                      <h2>
                        Today’s sessions{' '}
                        <span className="count-badge">{scheduled.length}</span>
                      </h2>
                      <button
                        className="text-button"
                        onClick={() => setView('Timetable')}
                      >
                        View timetable
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    {scheduled.length ? (
                      scheduled.map((s) => (
                        <SessionRow
                          key={s.id}
                          session={s}
                          topic={getTopic(s.topicId)}
                          onStart={() => start(s)}
                          onEdit={() => setEdit(s)}
                          disabled={!ready}
                        />
                      ))
                    ) : (
                      <div className="empty-plan">
                        <CalendarDays size={31} />
                        <div>
                          <h3>Your day is yours to plan.</h3>
                          <p>
                            Add your own session or let the planner spread your
                            topics out.
                          </p>
                        </div>
                        <button
                          className="button secondary"
                          onClick={() =>
                            setEdit({
                              ...sessionFor(topics[0].id),
                              time: '16:00',
                            })
                          }
                          disabled={!ready}
                        >
                          <Plus size={16} />
                          Add session
                        </button>
                      </div>
                    )}
                    <div className="break-note">
                      <Coffee size={16} />
                      <span>
                        A 5-minute breather between sessions is built into your
                        plan.
                      </span>
                    </div>
                  </div>
                  <div className="resource-feature">
                    <div className="resource-feature-top">
                      <span className="resource-logo">
                        1<span>st</span>
                      </span>
                      <ArrowUpRight size={25} />
                    </div>
                    <span className="eyebrow">YOUR MATHS SIDEKICK</span>
                    <h2>Stuck? Start here.</h2>
                    <p>
                      Clear explanations. Proper exam questions. First Class
                      Maths has your back.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setView('Practice')}
                    >
                      Open practice desk <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              </>
            )}
            {view === 'Timetable' && (
              <Timetable
                state={state}
                ready={ready}
                onEdit={setEdit}
                onStart={start}
                onPlan={() => setPlanOpen(true)}
              />
            )}
            {view === 'Topic map' && (
              <TopicMap
                state={state}
                ready={ready}
                onStart={(t) => start(sessionFor(t.id, state.settings.minutes))}
                onSave={save}
                onRate={(topic, confidence) =>
                  save(
                    rateTopic(state, topic.id, confidence, today),
                    `${['Red', 'Amber', 'Green'][confidence - 1]} saved for ${topic.title}.`,
                  )
                }
                today={today}
              />
            )}
            {view === 'Practice' && (
              <Suspense fallback={<output>Opening your practice desk…</output>}>
                <PracticeHub
                  state={state}
                  ready={ready}
                  today={today}
                  board={state.settings.board}
                  onSave={save}
                />
              </Suspense>
            )}
            {view === 'My grove' && (
              <>
                <div className="grove-full panel">
                  <div className="grove-full-copy">
                    <span className="eyebrow">A RECORD OF YOUR EFFORT</span>
                    <h2>
                      Level {level}
                      <span>
                        {completed < 5
                          ? 'The beginning.'
                          : completed < 20
                            ? 'Taking root.'
                            : 'In full bloom.'}
                      </span>
                    </h2>
                    <p>
                      {completed} sessions · {xp} XP · {hours} hours
                    </p>
                    <div className="palette-picker" aria-label="Tree colour">
                      {['#b8f78b', '#beacff', '#ffcb7e'].map((c, i) => (
                        <button
                          key={c}
                          style={{ background: c }}
                          aria-label={
                            ['Jade leaves', 'Lilac leaves', 'Amber leaves'][i]
                          }
                          aria-pressed={tint === c}
                          onClick={() => setTint(c)}
                        >
                          {tint === c && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Suspense
                    fallback={
                      <div className="model-loading">Growing your scene…</div>
                    }
                  >
                    <GroveScene count={completed} quiet={quiet} tint={tint} />
                  </Suspense>
                  <div className="grove-full-progress">
                    <span>
                      Next growth · {5 - (completed % 5)} sessions away
                    </span>
                    <Progress
                      value={((completed % 5) / 5) * 100}
                      aria-label="Next tree level"
                    />
                  </div>
                </div>
                <div className="milestones">
                  {[
                    {
                      n: 1,
                      title: 'First roots',
                      text: 'Finish your first session',
                      icon: Sprout,
                    },
                    {
                      n: 5,
                      title: 'Fresh growth',
                      text: 'Complete 5 sessions',
                      icon: Leaf,
                    },
                    {
                      n: 20,
                      title: 'Branching out',
                      text: 'Complete 20 sessions',
                      icon: TreePine,
                    },
                    {
                      n: 50,
                      title: 'A proper forest',
                      text: 'Complete 50 sessions',
                      icon: Map,
                    },
                  ].map((m) => (
                    <div
                      className={`milestone panel ${completed >= m.n ? 'unlocked' : ''}`}
                      key={m.n}
                    >
                      <m.icon size={26} />
                      <strong>{m.title}</strong>
                      <p>{m.text}</p>
                      <span>
                        {completed >= m.n
                          ? 'Unlocked'
                          : `${Math.min(completed, m.n)} / ${m.n}`}
                      </span>
                    </div>
                  ))}
                </div>
                <section className="panel log-panel">
                  <div className="section-title">
                    <h2>Session journal</h2>
                    <span className="subtle">Your last 20 sessions</span>
                  </div>
                  {logs.length ? (
                    logs
                      .slice(-20)
                      .reverse()
                      .map((l) => (
                        <div className="journal-entry" key={l.id}>
                          <Check size={16} />
                          <div>
                            <strong>{getTopic(l.topicId).title}</strong>
                            <p>
                              {l.note ||
                                [
                                  'Needs another go',
                                  'Getting there',
                                  'Feeling confident',
                                ][l.confidence - 1]}
                            </p>
                          </div>
                          <span>
                            {formatDate(l.date)} · {l.minutes} min
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="muted">
                      Your first completed session will appear here. The tree
                      never loses progress when you take a day off.
                    </p>
                  )}
                </section>
              </>
            )}
            {view === 'Maths lab' && (
              <Suspense
                fallback={
                  <div className="model-loading">Opening the maths lab…</div>
                }
              >
                <MathsLab quiet={quiet} />
              </Suspense>
            )}
            {view === 'Sources' && (
              <section className="panel">
                <Research />
              </section>
            )}
            {view === 'Account' && (
              <Suspense fallback={<output>Opening your account…</output>}>
                <AccountPanel
                  base={pagesBase || '/'}
                  state={state}
                  ready={ready}
                  save={save}
                />
              </Suspense>
            )}
            {view === 'Admin' && (
              <Suspense fallback={<output>Checking access…</output>}>
                <AdminPanel base={pagesBase || '/'} />
              </Suspense>
            )}
            {view === 'Privacy' && <PrivacyPolicy />}
            {view === 'Cookies' && <CookiePolicy />}
            {view === 'Credits' && <Credits />}
            {view === 'Resources' && (
              <Resources
                board={state.settings.board}
                setHelp={() => setHelp(true)}
              />
            )}
            <footer className="app-footer">
              {pagesBase && (
                <button
                  className="text-button"
                  onClick={() => setBackupOpen(true)}
                >
                  <Download size={14} />
                  Back up or restore progress
                </button>
              )}
              <span>
                <Sprout size={14} />
                Progress saves as you work.
              </span>
              <span>Quiet revision mode</span>
            </footer>
            <div className="legal-footer">
              <p>© 2026 Nathan Yu · Nathan’s Revision Grove</p>
              <p>
                Maths resources by{' '}
                <a
                  href="https://www.1stclassmaths.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  First Class Maths
                </a>
                . An independent project; not affiliated or endorsed.
              </p>
              <nav aria-label="Site information">
                <a href={pageHref('Credits', pagesBase || '/')}>
                  Copyright & credits
                </a>
                <a href={pageHref('Privacy', pagesBase || '/')}>Privacy</a>
                <a href={pageHref('Cookies', pagesBase || '/')}>
                  Cookies & storage
                </a>
                <a href={pageHref('Account', pagesBase || '/')}>Account</a>
                <a href={pageHref('Terms', pagesBase || '/')}>
                  Terms & conditions
                </a>
                <a href={pageHref('Home', pagesBase || '/')}>Home</a>
              </nav>
            </div>
          </main>
        </div>
        <Dialog open={backupOpen} onOpenChange={setBackupOpen}>
          <DialogContent className="app-dialog wide-dialog">
            <DialogHeader>
              <DialogTitle>Your progress, safely backed up</DialogTitle>
              <DialogDescription>
                {onlineAccount
                  ? 'This backup contains the cloud plan for your signed-in account. Restoring will replace that account’s plan after confirmation.'
                  : 'This backup contains your device-only plan. Export it before clearing browser data. Sign in to save progress across devices when accounts are available.'}
              </DialogDescription>
            </DialogHeader>
            <div className="form-stack">
              <button
                className="button primary"
                disabled={!ready}
                onClick={() => exportBackup(state)}
              >
                <Download size={17} />
                Download my backup
              </button>
              <label>
                Restore a Revision Grove backup
                <Input
                  type="file"
                  accept="application/json,.json"
                  onChange={async (e) => {
                    setBackupError('');
                    setBackupPreview(null);
                    if (e.target.files?.[0])
                      try {
                        setBackupPreview(await readBackup(e.target.files[0]));
                      } catch (error) {
                        setBackupError(
                          error instanceof Error
                            ? error.message
                            : 'Could not read this backup.',
                        );
                      }
                  }}
                />
              </label>
              {backupPreview && (
                <>
                  <p className="form-hint">
                    This backup contains {backupPreview.sessions.length} planned
                    sessions and {backupPreview.logs.length} completed sessions
                    for {backupPreview.settings.name}. Restoring replaces your
                    {onlineAccount ? ' cloud' : ' device'} plan. Download your
                    current backup first if you want to keep it.
                  </p>
                  <button
                    className="button secondary"
                    disabled={mutation.isPending}
                    onClick={async () => {
                      try {
                        if (onlineAccount) {
                          if (
                            !(await save(
                              backupPreview,
                              'Cloud backup restored',
                            ))
                          )
                            return;
                        } else {
                          cache.setQueryData(
                            ['plan'],
                            restoreDevicePlan(backupPreview),
                          );
                        }
                        mutation.reset();
                        setToast(
                          onlineAccount
                            ? 'Backup restored to your account'
                            : 'Backup restored on this device',
                        );
                        setBackupPreview(null);
                        setBackupOpen(false);
                      } catch (error) {
                        setBackupError(
                          error instanceof Error
                            ? error.message
                            : 'Could not restore this backup.',
                        );
                      }
                    }}
                  >
                    Restore this backup
                  </button>
                </>
              )}
              {backupError && (
                <p className="form-error" role="alert">
                  {backupError}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={planOpen} onOpenChange={setPlanOpen}>
          <DialogContent className="app-dialog wide-dialog">
            <PlanForm
              initial={state.settings}
              state={state}
              pending={mutation.isPending}
              onSave={onPlan}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!edit}
          onOpenChange={(open) => {
            if (!open) setEdit(null);
          }}
        >
          <DialogContent className="app-dialog">
            {edit && (
              <SessionForm
                initial={edit}
                state={state}
                pending={mutation.isPending}
                onSave={async (s) => {
                  if (overlaps(state.sessions, s)) {
                    setToast(
                      'That overlaps another session. Choose a different time.',
                    );
                    return false;
                  }
                  if (
                    await save(
                      {
                        ...state,
                        sessions: [
                          ...state.sessions.filter((x) => x.id !== s.id),
                          s,
                        ],
                      },
                      'Session saved',
                    )
                  ) {
                    setEdit(null);
                    return true;
                  }
                  return false;
                }}
                onDelete={
                  state.sessions.some((s) => s.id === edit.id)
                    ? async () => {
                        if (
                          await save(
                            {
                              ...state,
                              sessions: state.sessions.filter(
                                (s) => s.id !== edit.id,
                              ),
                            },
                            'Session removed',
                          )
                        )
                          setEdit(null);
                      }
                    : undefined
                }
              />
            )}
          </DialogContent>
        </Dialog>
        {active && (
          <FocusSession
            session={active}
            topic={getTopic(active.topicId)}
            quiet={quiet}
            pending={mutation.isPending}
            onExit={() => setActive(null)}
            onComplete={async (confidence, note, minutes) => {
              if (
                await save(
                  finishSession(state, active, confidence, note, minutes),
                  '+25 XP. A little more growth.',
                )
              ) {
                setActive(null);
                setView('My grove');
                return true;
              }
              return false;
            }}
          />
        )}
        <Dialog open={help} onOpenChange={setHelp}>
          <DialogContent className="app-dialog wide-dialog">
            <DialogHeader>
              <DialogTitle>Five questions behind the grove</DialogTitle>
              <DialogDescription>
                The research shaped the tools. The design choices are ours.
              </DialogDescription>
            </DialogHeader>
            <Research />
          </DialogContent>
        </Dialog>
        {toast && (
          <output className="toast">
            <Check size={17} />
            <span>{toast}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast('')}
            >
              <X size={16} />
            </button>
          </output>
        )}
      </div>
    </SidebarProvider>
  );
}
function Stat({
  label,
  value,
  unit,
  icon,
  detail,
  onClick,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  detail: string;
  onClick?: () => void;
}) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <span>{detail}</span>
      {onClick && (
        <button
          className="stat-link"
          onClick={onClick}
          aria-label="See topics ready to revisit"
        />
      )}
    </div>
  );
}
function SessionRow({
  session: s,
  topic: t,
  onStart,
  onEdit,
  disabled,
}: {
  session: Session;
  topic: Topic;
  onStart: () => void;
  onEdit: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`session-row ${s.done ? 'done' : ''}`}
      style={{ '--topic': categoryColour(t) } as CSSProperties}
    >
      <span className="session-time">
        {s.time}
        <small>{s.minutes} min</small>
      </span>
      <span className="session-stripe" />
      <div className="session-text">
        <span>
          {t.category}
          {s.review ? ' · Revisit' : ''}
        </span>
        <strong>{t.title}</strong>
      </div>
      {s.done ? (
        <span className="done-badge">
          <Check size={15} />
          Done
        </span>
      ) : (
        <>
          <button
            className="icon-button edit-button"
            onClick={onEdit}
            aria-label={`Edit ${t.title}`}
            disabled={disabled}
          >
            <Pencil size={15} />
          </button>
          <button
            className="round-play"
            onClick={onStart}
            aria-label={`Start ${t.title}`}
            disabled={disabled}
          >
            <Play size={16} />
          </button>
        </>
      )}
    </div>
  );
}

function Timetable({
  state,
  ready,
  onEdit,
  onStart,
  onPlan,
}: {
  state: AppState;
  ready: boolean;
  onEdit: (s: Session) => void;
  onStart: (s: Session) => void;
  onPlan: () => void;
}) {
  const [week, setWeek] = useState(monday(localDate()));
  const all = topicList(state);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const list = state.sessions.filter((s) => days.includes(s.date));
  function download() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Revision Grove//Planner//EN',
      ...state.sessions.flatMap((s) => [
        'BEGIN:VEVENT',
        `UID:${s.id}@revision-grove`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${s.date.replaceAll('-', '')}T${s.time.replace(':', '')}00`,
        `DTEND:${(toMinutes(s.time) + s.minutes === 1440 ? addDays(s.date, 1) : s.date).replaceAll('-', '')}T${timeString((toMinutes(s.time) + s.minutes) % 1440).replace(':', '')}00`,
        `SUMMARY:${(all.find((t) => t.id === s.topicId)?.title ?? 'Revision').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
        'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join('\r\n')], { type: 'text/calendar' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-revision-timetable.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="calendar-toolbar">
        <div className="week-picker">
          <button
            className="icon-button"
            aria-label="Previous week"
            onClick={() => setWeek(addDays(week, -7))}
          >
            <ChevronLeft size={18} />
          </button>
          <h2>
            {formatDate(week)} –{' '}
            {formatDate(addDays(week, 6), {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </h2>
          <button
            className="icon-button"
            aria-label="Next week"
            onClick={() => setWeek(addDays(week, 7))}
          >
            <ChevronRight size={18} />
          </button>
          <button
            className="button secondary"
            onClick={() => setWeek(monday(localDate()))}
          >
            This week
          </button>
        </div>
        <div className="button-row">
          <button
            className="button secondary"
            onClick={download}
            disabled={!state.sessions.length}
          >
            <Download size={16} />
            Export calendar
          </button>
          <button
            className="button primary"
            disabled={!ready}
            onClick={() =>
              onEdit({
                ...sessionFor(topics[0].id),
                date: localDate(),
                time: '16:00',
              })
            }
          >
            <Plus size={16} />
            Add session
          </button>
        </div>
      </div>
      <div className="calendar-summary">
        <span>
          <Clock3 size={16} />
          {list.reduce((n, s) => n + s.minutes, 0)} minutes planned
        </span>
        <span>
          <CheckCheck size={16} />
          {list.filter((s) => s.done).length} of {list.length} complete
        </span>
        <button onClick={onPlan}>
          <Settings2 size={15} />
          Adjust availability
        </button>
      </div>
      <div className="calendar-scroll">
        <div className="calendar-grid">
          {days.map((day) => (
            <div
              className={`calendar-day ${day === localDate() ? 'is-today' : ''}`}
              key={day}
            >
              <div className="day-heading">
                <span>{formatDate(day, { weekday: 'short' })}</span>
                <strong>{formatDate(day, { day: 'numeric' })}</strong>
                {day === localDate() && <small>TODAY</small>}
              </div>
              <div className="day-sessions">
                {state.sessions
                  .filter((s) => s.date === day)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((s) => {
                    const t = all.find((t) => t.id === s.topicId)!;
                    if (!t) return null;
                    return (
                      <div
                        key={s.id}
                        className={`calendar-event ${s.done ? 'event-done' : ''}`}
                        style={
                          { '--topic': categoryColour(t) } as CSSProperties
                        }
                      >
                        <button
                          className="event-details"
                          onClick={() => onEdit(s)}
                          disabled={!ready}
                        >
                          <span>
                            {s.time} · {s.minutes}m {s.done && '✓'}
                          </span>
                          <strong>{t.title}</strong>
                          <small>
                            {t.category}
                            {s.review ? ' · Review' : ''}
                          </small>
                        </button>
                        {!s.done && (
                          <button
                            className="event-start"
                            disabled={!ready}
                            onClick={() => onStart(s)}
                          >
                            <Play size={12} />
                            Focus
                          </button>
                        )}
                      </div>
                    );
                  })}
                {!state.sessions.some((s) => s.date === day) && (
                  <span className="rest-day">
                    {state.settings.days.includes(
                      new Date(day + 'T12:00:00').getDay(),
                    )
                      ? 'Space to study'
                      : 'Room to recharge'}
                  </span>
                )}
                <button
                  className="add-day"
                  disabled={!ready}
                  aria-label={`Add session on ${day}`}
                  onClick={() =>
                    onEdit({
                      ...sessionFor(topics[0].id),
                      date: day,
                      time: state.settings.time,
                    })
                  }
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="calendar-bottom">
        <span>
          <span className="live-dot" />
          Click a session to change its time or topic.
        </span>
        <span>5-minute gaps are built into generated plans.</span>
      </div>
    </>
  );
}

function PlanForm({
  initial,
  state,
  pending,
  onSave,
}: {
  initial: Settings;
  state: AppState;
  pending: boolean;
  onSave: (s: Settings) => void;
}) {
  const [s, set] = useState(initial);
  const [error, setError] = useState('');
  const setField = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    set({ ...s, [key]: value });
  const count = topicList(state).filter(
    (t) => state.progress[t.id]?.confidence !== 3,
  ).length;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Your week. Your pace.</DialogTitle>
        <DialogDescription>
          The planner spreads {count} topics across your available days, with
          weaker topics first. Rebuilding replaces upcoming unfinished sessions.
        </DialogDescription>
      </DialogHeader>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const p = settingsSchema.safeParse(s);
          if (!p.success) {
            setError(p.error.issues[0].message);
            return;
          }
          setError('');
          onSave(p.data);
        }}
        className="form-stack"
      >
        <div className="form-grid">
          <label>
            Your name
            <Input
              value={s.name}
              maxLength={35}
              required
              onChange={(e) => setField('name', e.target.value)}
            />
          </label>
          <label>
            Maths exam board
            <Picker
              label="Exam board"
              value={s.board}
              onChange={(v) => setField('board', v as Settings['board'])}
              options={['Edexcel', 'AQA', 'OCR'].map((x) => ({
                label: x,
                value: x,
              }))}
            />
          </label>
          <label>
            Start date
            <Input
              type="date"
              required
              value={s.start}
              onChange={(e) => setField('start', e.target.value)}
            />
          </label>
          <label>
            Finish by
            <Input
              type="date"
              required
              min={s.start}
              value={s.finish}
              onChange={(e) => setField('finish', e.target.value)}
            />
          </label>
        </div>
        <fieldset>
          <legend>Days that work for you</legend>
          <div className="weekday-choices">
            {[1, 2, 3, 4, 5, 6, 0].map((day, i) => (
              <label
                key={day}
                className={s.days.includes(day) ? 'selected' : ''}
              >
                <Checkbox
                  checked={s.days.includes(day)}
                  onCheckedChange={(checked) =>
                    setField(
                      'days',
                      checked
                        ? [...s.days, day]
                        : s.days.filter((d) => d !== day),
                    )
                  }
                  aria-label={
                    [
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                      'Sunday',
                    ][i]
                  }
                />
                <span>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-grid three">
          <label>
            Sessions per day
            <Picker
              label="Sessions per day"
              value={String(s.perDay)}
              onChange={(v) => setField('perDay', +v)}
              options={[1, 2, 3, 4, 5, 6].map((x) => ({
                label: String(x),
                value: String(x),
              }))}
            />
          </label>
          <label>
            Session length
            <Picker
              label="Session length"
              value={String(s.minutes)}
              onChange={(v) => setField('minutes', +v)}
              options={[15, 25, 40, 50, 60].map((x) => ({
                label: `${x} minutes`,
                value: String(x),
              }))}
            />
          </label>
          <label>
            Start time
            <Input
              type="time"
              value={s.time}
              required
              onChange={(e) => setField('time', e.target.value)}
            />
          </label>
        </div>
        <p className="form-hint">
          <Coffee size={16} />
          Each day includes 5-minute gaps. Confident topics stay in your review
          list.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={pending} type="submit">
          {pending ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <CalendarDays size={17} />
          )}
          Build my timetable
          <ArrowRight size={17} />
        </button>
      </form>
    </>
  );
}
function SessionForm({
  initial,
  state,
  pending,
  onSave,
  onDelete,
}: {
  initial: Session;
  state: AppState;
  pending: boolean;
  onSave: (s: Session) => Promise<boolean>;
  onDelete?: () => void;
}) {
  const [s, set] = useState(initial);
  const [error, setError] = useState('');
  const all = topicList(state);
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {onDelete ? 'Edit your session' : 'Make some time'}
        </DialogTitle>
        <DialogDescription>
          Choose a topic and give it a spot in your day.
        </DialogDescription>
      </DialogHeader>
      <form
        noValidate
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const valid = sessionSchema.safeParse(s);
          if (!valid.success) {
            setError(valid.error.issues[0].message);
            return;
          }
          if (toMinutes(s.time) + s.minutes > 1440) {
            setError('Please finish before midnight.');
            return;
          }
          if (overlaps(state.sessions, s)) {
            setError('This overlaps another session. Pick a different time.');
            return;
          }
          await onSave(s);
        }}
      >
        <label>
          Topic
          <Picker
            label="Session topic"
            value={s.topicId}
            onChange={(v) => set({ ...s, topicId: v })}
            options={all.map((t) => ({ label: t.title, value: t.id }))}
          />
        </label>
        <div className="form-grid">
          <label>
            Date
            <Input
              type="date"
              required
              value={s.date}
              onChange={(e) => set({ ...s, date: e.target.value })}
            />
          </label>
          <label>
            Start time
            <Input
              type="time"
              required
              value={s.time}
              onChange={(e) => set({ ...s, time: e.target.value })}
            />
          </label>
        </div>
        <label>
          Minutes
          <Input
            type="number"
            required
            min={5}
            max={90}
            value={s.minutes}
            onChange={(e) => set({ ...s, minutes: Number(e.target.value) })}
          />
        </label>
        {s.done && (
          <p className="form-hint">
            This session is complete. Your original journal entry is kept.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" type="submit" disabled={pending}>
          Save session
          <Check size={17} />
        </button>
        {onDelete && (
          <button
            className="delete-session"
            type="button"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash2 size={15} />
            Remove from timetable
          </button>
        )}
      </form>
    </>
  );
}

function TopicMap({
  state,
  ready,
  onStart,
  onSave,
  onRate,
  today,
}: {
  state: AppState;
  ready: boolean;
  onStart: (t: Topic) => void;
  onSave: (s: AppState, m: string) => Promise<boolean>;
  onRate: (topic: Topic, confidence: number) => Promise<boolean>;
  today: string;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All topics');
  const [filter, setFilter] = useState('All confidence');
  const [custom, setCustom] = useState(false);
  const [title, setTitle] = useState('');
  const all = topicList(state);
  const result = all.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'All topics' || category === t.category) &&
      (filter === 'All confidence' ||
        (filter === 'Not started' && !state.progress[t.id]) ||
        (filter === 'Revisit now' && state.progress[t.id]?.next <= today) ||
        (filter === 'Confident' && state.progress[t.id]?.confidence === 3) ||
        (filter === 'Needs practice' &&
          !!state.progress[t.id] &&
          state.progress[t.id].confidence < 3)),
  );
  return (
    <>
      <div className="category-grid">
        {categories.slice(0, 6).map((c, i) => {
          const group = all.filter((t) => t.category === c);
          const confident = group.filter(
            (t) => state.progress[t.id]?.confidence === 3,
          ).length;
          return (
            <button
              className={`category-card ${category === c ? 'selected' : ''}`}
              key={c}
              onClick={() => setCategory(category === c ? 'All topics' : c)}
              style={{ '--topic': colours[i] } as CSSProperties}
            >
              <span className="category-glyph">
                {['ƒ(x)', '∑', '△', '∝', '▥', '%'][i]}
              </span>
              <strong>{c}</strong>
              <span>
                {confident} / {group.length} confident
              </span>
              <Progress
                value={group.length ? (confident / group.length) * 100 : 0}
                aria-label={`${c} confidence`}
              />
            </button>
          );
        })}
      </div>
      <div className="topic-toolbar">
        <label className="search-box">
          <Search size={17} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a topic…"
            aria-label="Search topics"
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear topic search"
              onClick={() => setSearch('')}
            >
              <X size={15} />
            </button>
          )}
        </label>
        <Picker
          label="Topic category"
          value={category}
          onChange={setCategory}
          options={['All topics', ...categories].map((x) => ({
            label: x,
            value: x,
          }))}
        />
        <Picker
          label="Filter confidence"
          value={filter}
          onChange={setFilter}
          options={[
            'All confidence',
            'Not started',
            'Needs practice',
            'Confident',
            'Revisit now',
          ].map((x) => ({ label: x, value: x }))}
        />
        <button className="button secondary" onClick={() => setCustom(true)}>
          <Plus size={16} />
          My own topic
        </button>
      </div>
      <div className="topic-results">
        <span>{result.length} topics</span>
        <span>Set RAG here or after a practice question.</span>
      </div>
      <div className="topic-list">
        {result.map((t) => {
          const p = state.progress[t.id];
          return (
            <div
              className="topic-list-row"
              key={t.id}
              style={{ '--topic': categoryColour(t) } as CSSProperties}
            >
              <span className="topic-dot" />
              <div>
                <span>{t.category}</span>
                <strong>{t.title}</strong>
              </div>
              <fieldset className="rag-compact">
                <legend className="sr-only">
                  Rate confidence for {t.title}
                </legend>
                {[
                  ['R', 1, 'Red'],
                  ['A', 2, 'Amber'],
                  ['G', 3, 'Green'],
                ].map(([short, value, label]) => (
                  <button
                    key={label}
                    className={`rag-mini rag-${String(label).toLowerCase()}`}
                    aria-label={`${label}: ${t.title}`}
                    aria-pressed={p?.confidence === value}
                    disabled={!ready}
                    onClick={() => void onRate(t, Number(value))}
                  >
                    {short}
                  </button>
                ))}
              </fieldset>
              <span className="review-date">
                {p
                  ? p.next <= today
                    ? 'Revisit today'
                    : `Revisit ${formatDate(p.next)}`
                  : 'A fresh start'}
              </span>
              {t.video && (
                <a
                  className="icon-button"
                  href={t.video}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Watch ${t.title} video`}
                >
                  <ExternalLink size={16} />
                </a>
              )}
              <button
                className="button secondary small"
                disabled={!ready}
                onClick={() => onStart(t)}
              >
                Practise
                <Play size={13} />
              </button>
            </div>
          );
        })}
        {!result.length && (
          <div className="empty-plan">
            <Search size={24} />
            <p>No topics match. Try another search or confidence filter.</p>
          </div>
        )}
      </div>
      <Dialog open={custom} onOpenChange={setCustom}>
        <DialogContent className="app-dialog">
          <DialogHeader>
            <DialogTitle>Add your own topic</DialogTitle>
            <DialogDescription>
              Use a subject and a specific task, like “Biology — cell division”.
              It can join your next generated plan.
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                title.trim() &&
                (await onSave(
                  {
                    ...state,
                    customTopics: [
                      ...state.customTopics,
                      {
                        id: crypto.randomUUID(),
                        title: title.trim(),
                        category: 'My subjects',
                      },
                    ],
                  },
                  'Topic added',
                ))
              ) {
                setCustom(false);
                setTitle('');
              }
            }}
          >
            <label>
              Topic
              <Input
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <button
              className="button primary"
              disabled={!ready || !title.trim()}
            >
              Add topic
              <Plus size={16} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FocusSession({
  session,
  topic,
  quiet,
  pending,
  onExit,
  onComplete,
}: {
  session: Session;
  topic: Topic;
  quiet: boolean;
  pending: boolean;
  onExit: () => void;
  onComplete: (c: number, n: string, m: number) => Promise<boolean>;
}) {
  const [seconds, setSeconds] = useState(session.minutes * 60);
  const [endAt, setEndAt] = useState<number | null>(
    () => Date.now() + session.minutes * 60000,
  );
  const [stage, setStage] = useState<'focus' | 'rate' | 'leave'>('focus');
  const [confidence, setConfidence] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [breakMode, setBreakMode] = useState(false);
  const [focusRemaining, setFocusRemaining] = useState(session.minutes * 60);
  useEffect(() => {
    if (!endAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        setEndAt(null);
        if (!breakMode) setStage('rate');
        else {
          setBreakMode(false);
          setSeconds(focusRemaining);
        }
      }
    };
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [endAt, breakMode, focusRemaining]);
  function pause() {
    if (endAt) {
      setSeconds(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
      setEndAt(null);
    } else setEndAt(Date.now() + seconds * 1000);
  }
  const minutesLogged = Math.max(
    0,
    Math.min(
      session.minutes,
      Math.round(
        (session.minutes * 60 - (breakMode ? focusRemaining : seconds)) / 60,
      ),
    ),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setEndAt(null);
          setStage('leave');
        }
      }}
    >
      <DialogContent
        className={`app-dialog focus-dialog ${quiet ? 'quiet' : ''}`}
        showCloseButton={false}
      >
        <DialogHeader>
          <span className="eyebrow">
            <span className="live-dot" />
            {breakMode ? 'TAKE A BREATHER' : 'FOCUS MODE'}
          </span>
          <DialogTitle>
            {stage === 'rate'
              ? 'How did that feel?'
              : stage === 'leave'
                ? 'Leave this session?'
                : topic.title}
          </DialogTitle>
          <DialogDescription>
            {stage === 'rate'
              ? 'Check your answers, then rate your confidence. This sets a suggested revisit date.'
              : stage === 'leave'
                ? 'You can log what you did, or leave without adding progress.'
                : breakMode
                  ? 'Stand up, get some water, look away from the screen.'
                  : 'Close your notes. Try recalling the method before checking it.'}
          </DialogDescription>
        </DialogHeader>
        {stage === 'focus' && (
          <>
            <div className={`focus-clock ${endAt ? 'running' : ''}`}>
              <svg viewBox="0 0 240 240" aria-hidden="true">
                <circle cx="120" cy="120" r="108" />
                <circle
                  className="timer-arc"
                  cx="120"
                  cy="120"
                  r="108"
                  strokeDasharray={679}
                  strokeDashoffset={
                    679 *
                    (1 - seconds / (breakMode ? 300 : session.minutes * 60))
                  }
                />
              </svg>
              <div>
                <span>
                  {String(Math.floor(seconds / 60)).padStart(2, '0')}
                  <em>:</em>
                  {String(seconds % 60).padStart(2, '0')}
                </span>
                <small>
                  {endAt ? 'one thing at a time' : 'paused · take your time'}
                </small>
              </div>
            </div>
            <div className="focus-actions">
              <button
                className="button primary"
                onClick={pause}
                disabled={seconds === 0}
              >
                {endAt ? <Pause size={17} /> : <Play size={17} />}{' '}
                {endAt ? 'Pause' : 'Resume'}
              </button>
              {!breakMode && (
                <button
                  className="button secondary"
                  onClick={() => {
                    setEndAt(null);
                    setStage('rate');
                  }}
                >
                  Finish & reflect
                  <Check size={17} />
                </button>
              )}
            </div>
            <button
              className="text-button centre"
              onClick={() => {
                if (breakMode) {
                  setSeconds(focusRemaining);
                  setBreakMode(false);
                  setEndAt(null);
                } else {
                  setFocusRemaining(seconds);
                  setSeconds(300);
                  setBreakMode(true);
                  setEndAt(Date.now() + 300000);
                }
              }}
            >
              <Coffee size={15} />
              {breakMode ? 'Back to revision' : 'Take a 5-minute break'}
            </button>
            {topic.video && !breakMode && (
              <a
                className="focus-resource"
                href={topic.video}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen size={16} />
                Need a hand? Open the First Class Maths video
                <ArrowUpRight size={15} />
              </a>
            )}
            <button
              className="text-button centre"
              onClick={() => {
                setEndAt(null);
                setStage('leave');
              }}
            >
              Leave session
            </button>
          </>
        )}
        {stage === 'rate' && (
          <>
            <div className="completion-summary">
              <Leaf size={21} />
              <span>{minutesLogged} minutes focused</span>
              <strong>+25 XP on saving</strong>
            </div>
            <div className="confidence-options">
              {[
                {
                  label: 'Needs another go',
                  sub: 'Revisit in 1 day',
                  icon: '↻',
                },
                { label: 'Getting there', sub: 'Revisit in 3 days', icon: '↗' },
                {
                  label: 'I can explain it',
                  sub: 'Revisit in 7 days',
                  icon: '✓',
                },
              ].map((x, i) => (
                <button
                  key={x.label}
                  aria-pressed={confidence === i + 1}
                  className={confidence === i + 1 ? 'selected' : ''}
                  onClick={() => setConfidence(i + 1)}
                >
                  <span>{x.icon}</span>
                  <strong>{x.label}</strong>
                  <small>{x.sub}</small>
                </button>
              ))}
            </div>
            <label className="reflection-label">
              One thing to remember <span>(optional)</span>
              <textarea
                className="resize-none"
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Where did you get stuck? What clicked?"
              />
            </label>
            <p className="form-hint">
              These review gaps are a starting point. Move sessions whenever you
              need.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary"
              disabled={!confidence || pending}
              onClick={async () => {
                if (!(await onComplete(confidence, note, minutesLogged)))
                  setError(
                    'Could not save your session. Your reflection is still here; try again.',
                  );
              }}
            >
              {pending ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Sprout size={17} />
              )}
              Save & grow
            </button>
            <button
              className="text-button centre"
              onClick={() => setStage('focus')}
            >
              Back to session
            </button>
          </>
        )}
        {stage === 'leave' && (
          <div className="form-stack">
            <button className="button primary" onClick={() => setStage('rate')}>
              Log what I did
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setStage('focus');
                setEndAt(Date.now() + seconds * 1000);
              }}
            >
              Keep going
            </button>
            <button className="text-button centre" onClick={onExit}>
              Leave without saving
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Resources({ board, setHelp }: { board: string; setHelp: () => void }) {
  const list = [
    {
      title: `${board === 'AQA' ? 'AQA' : 'Edexcel'} topic revision`,
      tag: 'WATCH · PRACTISE · CHECK',
      description:
        'Topic videos, exam-style questions and worked solutions. Choose your grade on First Class Maths.',
      url: `https://www.1stclassmaths.com/${board === 'AQA' ? 'aqa' : 'edexcel'}revision`,
      symbol: 'ƒ(x)',
      colour: '#c4b5fd',
    },
    {
      title: 'GCSE past papers',
      tag: 'ALL EXAM BOARDS',
      description:
        'Edexcel, AQA and OCR papers with mark schemes. Pick Higher or Foundation when you arrive.',
      url: 'https://www.1stclassmaths.com/gcse-exam-papers',
      symbol: 'A+',
      colour: '#d7ed9e',
    },
    {
      title: 'Practice papers',
      tag: 'EXAM PRACTICE',
      description:
        'Original First Class Maths papers for practising under timed conditions.',
      url: 'https://www.1stclassmaths.com/exam-papers',
      symbol: '✎',
      colour: '#ffbc91',
    },
    {
      title: 'A-level revision',
      tag: 'THE NEXT CHAPTER',
      description:
        'Explore A-level maths explanations, questions and solutions when you’re ready.',
      url: 'https://www.1stclassmaths.com/alevelrevision',
      symbol: '∫',
      colour: '#86ddd2',
    },
  ];
  return (
    <>
      <div className="resource-intro">
        <span className="resource-logo">
          1<span>st</span>
        </span>
        <div>
          <h2>First Class Maths</h2>
          <p>
            Resources by First Class Maths. This is an independent revision
            planner.
          </p>
        </div>
        <a
          className="button secondary"
          href="https://www.1stclassmaths.com/"
          target="_blank"
          rel="noreferrer"
        >
          Visit website
          <ArrowUpRight size={17} />
        </a>
      </div>
      {board === 'OCR' && (
        <p className="form-hint">
          OCR past papers are available below. The topic library link uses
          Edexcel resources; check your OCR specification for coverage.
        </p>
      )}
      <div className="resource-grid">
        {list.map((r) => (
          <a
            className="resource-card panel"
            href={r.url}
            key={r.url}
            target="_blank"
            rel="noreferrer"
            style={{ '--topic': r.colour } as CSSProperties}
          >
            <div className="resource-art">
              <span>{r.symbol}</span>
              <ArrowUpRight size={24} />
            </div>
            <span className="eyebrow">{r.tag}</span>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            <span className="resource-card-link">
              Open resources
              <ArrowRight size={16} />
            </span>
          </a>
        ))}
      </div>
      <div className="resource-credit">
        <p>
          Individual topic video links are credited to Nathan’s original
          resource list. A video may cover several related topics.
        </p>
        <button className="text-button" onClick={setHelp}>
          Why these study tools?
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
function Research() {
  const rows = [
    {
      q: 'What helps a topic stick?',
      a: 'Use retrieval practice and revisit topics over time. The focus prompt and review list put that into practice; the 1, 3 and 7-day gaps are adjustable starting points.',
      url: 'https://www.learningscientists.org/faq',
      source: 'The Learning Scientists',
    },
    {
      q: 'What makes a timetable manageable?',
      a: 'Plan realistic chunks and regular breaks. Sessions are adjustable, with 25 minutes as the default and five-minute gaps in generated plans.',
      url: 'https://www.ucl.ac.uk/study/current-students/exams-and-assessments/assessment-success-guide/effective-revision-and-assessment-planning',
      source: 'University College London',
    },
    {
      q: 'How should game elements reward progress?',
      a: 'Use choice and visible feedback. The tree records completed sessions; it does not measure ability or predict grades. Taking a day off never removes growth.',
      url: 'https://link.springer.com/article/10.1007/s11423-023-10337-7',
      source: 'Gamification research review',
    },
    {
      q: 'Which maths resources belong in the plan?',
      a: 'First Class Maths pairs explanations with questions and solutions. The topic map keeps video links next to the topic you are practising.',
      url: 'https://www.1stclassmaths.com/edexcelrevision',
      source: 'First Class Maths',
    },
    {
      q: 'How can animations stay comfortable?',
      a: 'Follow reduced-motion preferences and offer a visible control. Calm motion stops automatic rotation and decorative movement; models remain draggable.',
      url: 'https://www.w3.org/WAI/WCAG21/Techniques/css/C39',
      source: 'W3C accessibility guidance',
    },
  ];
  return (
    <div className="research-list">
      {rows.map((r, i) => (
        <article key={r.q}>
          <span>0{i + 1}</span>
          <div>
            <h3>{r.q}</h3>
            <p>{r.a}</p>
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.source}
              <ArrowUpRight size={13} />
            </a>
          </div>
        </article>
      ))}
      <p className="muted">
        Inspired by{' '}
        <a
          href="https://defnotsquishy.github.io/nathans-revision-tool/"
          target="_blank"
          rel="noreferrer"
        >
          Nathan’s Revision Tool
        </a>
        . Research checked 5 September 2026.
      </p>
    </div>
  );
}
