import { useEffect, useRef, useState } from 'react';
import { useCloud } from './cloud-provider';
import { accountError } from '@/lib/cloud-config';
import type { CloudRuntime } from '@/lib/cloud-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
type Result = Awaited<ReturnType<CloudRuntime['listMembers']>>;
export default function AdminPanel({ base }: { base: string }) {
  const cloud = useCloud();
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [change, setChange] = useState<{
    uid: string;
    username: string;
    role: 'member' | 'admin';
  } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const permitted = cloud.role === 'owner' || cloud.role === 'admin';
  useEffect(() => {
    if (!permitted || !cloud.runtime) return;
    let disposed = false;
    void cloud.runtime
      .listMembers()
      .then((data) => {
        if (!disposed) setResult(data);
      })
      .catch((e) => {
        if (!disposed) setError(accountError(e));
      });
    return () => {
      disposed = true;
    };
  }, [cloud.runtime, permitted]);
  async function loadMore() {
    if (!cloud.runtime || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await cloud.runtime.listMembers(result?.cursor);
      setResult((prev) => ({
        ...next,
        members: [...(prev?.members || []), ...next.members],
      }));
    } catch (e) {
      setError(accountError(e));
    } finally {
      setBusy(false);
    }
  }
  if (cloud.loading)
    return (
      <section className="panel account-panel">
        <output>Checking admin access…</output>
      </section>
    );
  if (!permitted)
    return (
      <section className="panel account-panel">
        <h2>Admin access required</h2>
        <p>
          This page is available only to authorised administrators. Student
          progress remains private.
        </p>
        <a className="button secondary" href={base + 'account/'}>
          Open my account
        </a>
      </section>
    );
  return (
    <section className="panel account-panel admin-panel">
      <h2>Account directory</h2>
      <p>
        Admins can see usernames and account roles. Revision plans, emails and
        reflection notes are not shown here. Only the owner can grant or remove
        admin access.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!result && !error && <output>Loading accounts…</output>}
      {!result && error && (
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void loadMore()}
        >
          {busy ? 'Loading…' : 'Try loading accounts again'}
        </button>
      )}
      {result && (
        <>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Username</th>
                  <th scope="col">Role</th>
                  <th scope="col">Access</th>
                </tr>
              </thead>
              <tbody>
                {result.members.map((member) => (
                  <tr key={member.uid}>
                    <td>{member.username}</td>
                    <td>{member.role}</td>
                    <td>
                      {cloud.role === 'owner' &&
                      member.uid !== cloud.user?.uid &&
                      member.role !== 'owner' ? (
                        <button
                          className="button small secondary"
                          disabled={busy}
                          onClick={() =>
                            setChange({
                              ...member,
                              role:
                                member.role === 'admin' ? 'member' : 'admin',
                            })
                          }
                        >
                          {member.role === 'admin'
                            ? 'Remove admin…'
                            : 'Make admin…'}
                        </button>
                      ) : (
                        'No changes available'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.members.length && <p>No verified accounts yet.</p>}
          {result.more && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void loadMore()}
            >
              {busy ? 'Loading…' : 'Load 25 more accounts'}
            </button>
          )}
        </>
      )}
      <Dialog
        open={Boolean(change)}
        onOpenChange={(open) => {
          if (!open && !busy) setChange(null);
        }}
      >
        <DialogContent className="app-dialog" initialFocus={cancelRef}>
          <DialogHeader>
            <DialogTitle>Change account access?</DialogTitle>
            <DialogDescription>
              {change?.role === 'admin'
                ? `Give ${change?.username} access to the username directory? This does not grant access to anyone else’s revision progress.`
                : `Remove ${change?.username}’s access to the admin directory? Their own revision progress is unaffected.`}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="account-actions">
            <button
              ref={cancelRef}
              className="button secondary"
              disabled={busy}
              onClick={() => setChange(null)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                if (!change || !cloud.runtime) return;
                setBusy(true);
                setError('');
                try {
                  await cloud.runtime.setRole(change.uid, change.role);
                  setResult((prev) =>
                    prev
                      ? {
                          ...prev,
                          members: prev.members.map((m) =>
                            m.uid === change.uid
                              ? { ...m, role: change.role }
                              : m,
                          ),
                        }
                      : prev,
                  );
                  setChange(null);
                } catch (e) {
                  setError(accountError(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Saving…' : 'Change role'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
