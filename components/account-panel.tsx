import { useRef, useState, type SubmitEvent } from 'react';
import { Eye, EyeOff, ShieldCheck, Cloud, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCloud } from './cloud-provider';
import { cloudConfigured, accountError } from '@/lib/cloud-config';
import { readDevicePlan, exportBackup } from '@/lib/device-storage';
import { pageHref } from '@/lib/pages';
import type { AppState } from '@/lib/model';

function ProfileEditor({
  state,
  ready,
  save,
}: {
  state: AppState;
  ready: boolean;
  save: (state: AppState, message?: string) => Promise<boolean>;
}) {
  const [editedName, setDraft] = useState<string | null>(null);
  const draft = editedName ?? state.settings.name;
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  return (
    <section className="panel account-panel profile-editor">
      <h2>Your revision profile</h2>
      <p>
        Choose the name shown in your workspace. A nickname is fine. This saves
        with your revision progress.
      </p>
      <form
        noValidate
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !ready) return;
          const next = draft.trim();
          if (!next || next.length > 35) {
            setFeedback('Enter a name between 1 and 35 characters.');
            return;
          }
          setBusy(true);
          setFeedback('');
          try {
            const saved = await save(
              { ...state, settings: { ...state.settings, name: next } },
              'Profile saved',
            );
            setFeedback(
              saved
                ? 'Profile saved.'
                : 'Your profile could not be saved. Check your connection and try again.',
            );
          } catch {
            setFeedback('Your profile could not be saved. Try again.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="revision-name">Revision name</label>
        <Input
          id="revision-name"
          autoComplete="nickname"
          maxLength={35}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={busy || !ready}
        />
        <button
          className="button primary"
          disabled={busy || !ready || draft.trim() === state.settings.name}
        >
          {busy ? 'Saving…' : 'Save profile'}
        </button>
        <output aria-live="polite">{feedback}</output>
      </form>
    </section>
  );
}

export default function AccountPanel(props: {
  base: string;
  state: AppState;
  ready: boolean;
  save: (state: AppState, message?: string) => Promise<boolean>;
}) {
  const cloud = useCloud();
  return (
    <div className="profile-page">
      <ProfileEditor key={cloud.user?.uid ?? 'guest'} {...props} />
      <AccountControls {...props} />
    </div>
  );
}

function AccountControls({
  base,
  state,
  ready,
  save,
}: {
  base: string;
  state: AppState;
  ready: boolean;
  save: (state: AppState, message?: string) => Promise<boolean>;
}) {
  const cloud = useCloud();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState(''),
    [name, setName] = useState(''),
    [password, setPassword] = useState('');
  const [show, setShow] = useState(false),
    [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<'import' | 'delete' | null>(
    null,
  );
  const [importPlan, setImportPlan] = useState<AppState | null>(null);
  const [invalidField, setInvalidField] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  async function action(job: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setInvalidField('');
    setMessage('');
    try {
      await job();
      setMessage(success);
    } catch (e) {
      setError(accountError(e));
    } finally {
      setBusy(false);
    }
  }
  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cloud.runtime || busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      setInvalidField('email');
      form.current?.querySelector<HTMLInputElement>('[type=email]')?.focus();
      return;
    }
    if (
      mode !== 'reset' &&
      (password.length < (mode === 'signup' ? 12 : 1) || password.length > 128)
    ) {
      setError('Enter your password. New passwords need 12–128 characters.');
      setInvalidField('password');
      form.current?.querySelector<HTMLInputElement>('[name=password]')?.focus();
      return;
    }
    if (mode === 'signup' && !/^[\p{L}\p{N} _.-]{2,30}$/u.test(name.trim())) {
      setError(
        'Use 2–30 letters, numbers, spaces, dots, underscores or hyphens for your username.',
      );
      setInvalidField('username');
      form.current?.querySelector<HTMLInputElement>('[name=username]')?.focus();
      return;
    }
    const service = cloud.runtime;
    void action(
      async () => {
        if (mode === 'signup')
          await service.register(name, email, password, remember);
        else if (mode === 'signin')
          await service.signIn(email, password, remember);
        else {
          try {
            await service.reset(email);
          } catch (e) {
            if (
              !(
                typeof e === 'object' &&
                e &&
                'code' in e &&
                e.code === 'auth/user-not-found'
              )
            )
              throw e;
          }
        }
        setPassword('');
      },
      mode === 'reset'
        ? 'If this address has an account, a password reset email will arrive shortly. Check your junk folder too.'
        : mode === 'signup'
          ? 'Check your inbox to verify your email before saving online.'
          : 'Signed in.',
    );
  }
  const notices = (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && <output className="account-notice">{message}</output>}
    </>
  );
  if (!cloudConfigured)
    return (
      <section className="panel account-panel">
        <Cloud aria-hidden="true" />
        <h2>Cloud accounts are being prepared</h2>
        <p>
          You can keep revising and saving on this device. Sign-in will become
          available once the site owner connects the account service.
        </p>
        <button
          className="button secondary"
          disabled={!ready}
          onClick={() => exportBackup(state)}
        >
          <Download size={16} />
          Download my progress
        </button>
        <p>
          <a href={pageHref('Privacy', base)}>How your data is handled</a>
        </p>
      </section>
    );
  if (cloud.loading)
    return (
      <section className="panel account-panel" aria-busy="true">
        <output>Checking your account…</output>
      </section>
    );
  if (cloud.user)
    return (
      <section className="panel account-panel">
        <div className="account-heading">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2>{cloud.user.username}</h2>
            <p>{cloud.user.email}</p>
          </div>
        </div>
        <p>
          {cloud.user.verified
            ? 'Your cloud plan is private to your account. Device progress stays separate until you choose to upload it.'
            : 'Verify your email to switch on cloud saving. Until then, your revision stays on this device.'}
        </p>
        {cloud.error && (
          <p className="form-error" role="alert">
            {cloud.error}
          </p>
        )}
        {notices}
        <div className="account-actions">
          {!cloud.user.verified && (
            <>
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const user = await cloud.runtime!.refresh();
                    if (!user?.verified)
                      throw new Error(
                        'Your email is not verified yet. Open the link in your verification email, then check again.',
                      );
                  }, 'Email verified.')
                }
              >
                I’ve verified my email
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  void action(
                    () => cloud.runtime!.verify(),
                    'Verification email sent.',
                  )
                }
              >
                Resend verification email
              </button>
            </>
          )}
          {cloud.user.verified && (
            <>
              <button
                className="button secondary"
                disabled={busy || !ready}
                onClick={() => {
                  try {
                    setImportPlan(readDevicePlan().state);
                    setConfirmation('import');
                    setError('');
                  } catch (e) {
                    setError(accountError(e));
                  }
                }}
              >
                Upload this device’s progress
              </button>
              <button
                className="button secondary"
                disabled={!ready}
                onClick={() => exportBackup(state)}
              >
                Download cloud progress
              </button>
            </>
          )}
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              void action(() => cloud.runtime!.signOut(), 'Signed out.')
            }
          >
            Sign out
          </button>
        </div>
        <p className="form-hint">
          Only choose “Remember me” on a device you do not share. Sign out when
          you finish on a school or shared computer.
        </p>
        <div className="account-danger">
          <h3>Delete my account</h3>
          <p>
            Deletes your cloud plan, username and sign-in account. Download your
            cloud progress first. Device-only backups are separate. A minimal
            account-ID and deletion-time marker remains to block old sessions
            from restoring deleted records.
          </p>
          <button
            className="button secondary danger-button"
            disabled={busy}
            onClick={() => {
              setPassword('');
              setConfirmation('delete');
              setError('');
            }}
          >
            Delete my account…
          </button>
        </div>
        <Dialog
          open={confirmation !== null}
          onOpenChange={(open) => {
            if (!open && !busy) {
              setConfirmation(null);
              setPassword('');
            }
          }}
        >
          <DialogContent className="app-dialog" initialFocus={cancelRef}>
            <DialogHeader>
              <DialogTitle>
                {confirmation === 'import'
                  ? 'Replace your cloud plan?'
                  : 'Delete your account permanently?'}
              </DialogTitle>
              <DialogDescription>
                {confirmation === 'import'
                  ? `Upload ${importPlan?.sessions.length ?? 0} planned sessions and ${importPlan?.logs.length ?? 0} completed sessions from this device. This replaces your current cloud plan. Download it first if you want to keep it.`
                  : 'Your cloud progress and account will be deleted. This cannot be undone. Enter your current password to confirm.'}
              </DialogDescription>
            </DialogHeader>
            {confirmation === 'delete' && (
              <label className="account-field">
                Current password
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {notices}
            <div className="account-actions">
              <button
                ref={cancelRef}
                className="button secondary"
                disabled={busy}
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className={`button primary ${confirmation === 'delete' ? 'danger-button' : ''}`}
                disabled={
                  busy ||
                  (confirmation === 'import' && !ready) ||
                  (confirmation === 'delete' && !password)
                }
                onClick={() =>
                  void action(
                    async () => {
                      if (confirmation === 'import') {
                        if (
                          !(await save(
                            importPlan!,
                            'Device progress uploaded to your account',
                          ))
                        )
                          throw new Error(
                            'Upload was not saved. Check the page error and reload the cloud plan before retrying.',
                          );
                      } else await cloud.runtime!.deleteAccount(password);
                      setPassword('');
                      setConfirmation(null);
                    },
                    confirmation === 'import'
                      ? 'Device progress uploaded.'
                      : 'Account deleted.',
                  )
                }
              >
                {busy
                  ? 'Please wait…'
                  : confirmation === 'import'
                    ? 'Replace cloud plan'
                    : 'Delete account and cloud progress'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    );
  return (
    <section className="panel account-panel">
      <div className="account-heading">
        <Cloud aria-hidden="true" />
        <div>
          <h2>
            {mode === 'signup'
              ? 'Create your account'
              : mode === 'reset'
                ? 'Reset your password'
                : 'Pick up where you left off'}
          </h2>
          <p>Save your revision progress across devices.</p>
        </div>
      </div>
      <form
        noValidate
        ref={form}
        onSubmit={submit}
        className="form-stack"
        aria-busy={busy}
      >
        {mode === 'signup' && (
          <label>
            Username
            <Input
              autoComplete="nickname"
              name="username"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={invalidField === 'username'}
              aria-describedby={
                invalidField === 'username'
                  ? 'account-username-help account-error'
                  : 'account-username-help'
              }
            />
            <small id="account-username-help">
              Use a nickname, not your full name. Usernames are display names
              and need not be unique.
            </small>
          </label>
        )}
        <label>
          Email
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={invalidField === 'email'}
            aria-describedby={
              invalidField === 'email' ? 'account-error' : undefined
            }
          />
        </label>
        {mode !== 'reset' && (
          <label>
            Password
            <div className="password-field">
              <Input
                name="password"
                aria-invalid={invalidField === 'password'}
                aria-describedby={
                  invalidField === 'password' ? 'account-error' : undefined
                }
                type={show ? 'text' : 'password'}
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'signup' && (
              <small>
                At least 12 characters. Password managers and paste are welcome.
              </small>
            )}
          </label>
        )}
        {mode !== 'reset' && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me on this private device
          </label>
        )}
        {mode === 'signup' && (
          <p className="form-hint">
            We use your email for sign-in, verification and recovery; your
            username and progress make the app work. We do not sell your data.
            Read the <a href={pageHref('Privacy', base)}>privacy policy</a>{' '}
            before creating an account.
          </p>
        )}
        {error && (
          <p id="account-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && <output className="account-notice">{message}</output>}
        <button className="button primary" disabled={busy || !cloud.runtime}>
          {busy
            ? 'Please wait…'
            : mode === 'signup'
              ? 'Create account'
              : mode === 'reset'
                ? 'Send reset email'
                : 'Sign in'}
        </button>
      </form>
      <div className="account-actions">
        {(['signin', 'signup', 'reset'] as const)
          .filter((item) => item !== mode)
          .map((item) => (
            <button
              key={item}
              className="text-button"
              disabled={busy}
              onClick={() => {
                setMode(item);
                setInvalidField('');
                setError('');
                setMessage('');
                setPassword('');
              }}
            >
              {item === 'signin'
                ? 'Sign in instead'
                : item === 'signup'
                  ? 'Create an account'
                  : 'Forgot your password?'}
            </button>
          ))}
      </div>
      {cloud.error && (
        <p className="form-error" role="alert">
          {cloud.error}
        </p>
      )}
      <p className="form-hint">
        Prefer to stay on this device?{' '}
        <a href={base}>Continue without an account.</a>
      </p>
    </section>
  );
}
