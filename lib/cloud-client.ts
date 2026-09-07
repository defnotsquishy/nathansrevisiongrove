import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  reauthenticateWithCredential,
  EmailAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  setDoc,
  type QueryDocumentSnapshot,
  connectFirestoreEmulator,
} from 'firebase/firestore/lite';
import { cloudSettings, type CloudUser, type Role } from './cloud-config';
import { emptyState, stateSchema, type AppState } from './model';
import type { Saved } from './device-storage';

const app = initializeApp(cloudSettings.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
// Compiled out of published builds. Tests may only connect on loopback hosts.
if (import.meta.env.VITE_GROVE_EMULATORS === 'true') {
  if (!['127.0.0.1', 'localhost'].includes(location.hostname))
    throw new Error('Emulator builds can only run locally.');
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}
const current = () => {
  const user = auth.currentUser;
  if (!user?.emailVerified)
    throw new Error('Verify your email before saving online.');
  return user;
};
const username = (value: string) => {
  const name = value.trim();
  if (!/^[\p{L}\p{N} _.-]{2,30}$/u.test(name))
    throw new Error(
      'Use 2–30 letters, numbers, spaces, dots, underscores or hyphens for your username.',
    );
  return name;
};
function safeUser(): CloudUser | null {
  const u = auth.currentUser;
  return u
    ? {
        uid: u.uid,
        email: u.email || '',
        username: u.displayName || 'Student',
        verified: u.emailVerified,
      }
    : null;
}
export const runtime = {
  listen(callback: (user: CloudUser | null) => void) {
    return onIdTokenChanged(auth, () => callback(safeUser()));
  },
  async signIn(email: string, password: string, remember: boolean) {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    await signInWithEmailAndPassword(auth, email.trim(), password);
  },
  async register(
    name: string,
    email: string,
    password: string,
    remember: boolean,
  ) {
    const validName = username(name);
    if (password.length < 12 || password.length > 128)
      throw new Error('Use a password between 12 and 128 characters.');
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    const result = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    await updateProfile(result.user, { displayName: validName });
    await sendEmailVerification(result.user);
  },
  async verify() {
    if (!auth.currentUser) throw new Error('Sign in first.');
    await sendEmailVerification(auth.currentUser);
  },
  async refresh() {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    await auth.currentUser.getIdToken(true);
    return safeUser();
  },
  async reset(email: string) {
    await sendPasswordResetEmail(auth, email.trim());
  },
  async signOut() {
    await signOut(auth);
  },
  async profile() {
    const u = current();
    const ref = doc(db, 'profiles', u.uid);
    return runTransaction(db, async (tx) => {
      const snapshot = await tx.get(ref);
      if (snapshot.exists()) {
        return { username: String(snapshot.data().username) };
      }
      const name = username(u.displayName || 'Student');
      tx.set(ref, { username: name, createdAt: serverTimestamp() });
      return { username: name };
    });
  },
  async role(): Promise<Role> {
    const ref = await getDoc(doc(db, 'access', current().uid));
    const role = ref.exists() ? ref.data().role : 'member';
    return role === 'owner' || role === 'admin' ? role : 'member';
  },
  async readPlan(expectedUid: string): Promise<Saved> {
    const u = current();
    if (u.uid !== expectedUid)
      throw new Error(
        'Your signed-in account changed. Reload before continuing.',
      );
    const snapshot = await getDoc(doc(db, 'plans', u.uid));
    if (!snapshot.exists()) {
      const state = emptyState();
      state.settings.name = u.displayName || 'Student';
      return { state, revision: 0 };
    }
    const value = snapshot.data();
    return {
      state: stateSchema.parse(JSON.parse(value.payload)),
      revision: value.revision,
    };
  },
  async writePlan(
    state: AppState,
    revision: number,
    expectedUid: string,
  ): Promise<Saved> {
    const u = current();
    if (u.uid !== expectedUid)
      throw new Error(
        'Your signed-in account changed. Reload before continuing.',
      );
    const parsed = stateSchema.parse(state);
    const payload = JSON.stringify(parsed);
    if (new TextEncoder().encode(payload).length > 700000)
      throw new Error(
        'This plan is too large for cloud saving. Download a backup before reducing the stored history.',
      );
    const ref = doc(db, 'plans', u.uid);
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(ref);
      const actual = existing.exists() ? existing.data().revision : 0;
      if (actual !== revision)
        throw new Error(
          'Your cloud plan changed on another tab or device. Keep a copy of your edits, then reload the saved plan before trying again.',
        );
      tx.set(ref, {
        payload,
        revision: revision + 1,
        updatedAt: serverTimestamp(),
      });
    });
    return { state: parsed, revision: revision + 1 };
  },
  async listMembers(cursor?: QueryDocumentSnapshot) {
    current();
    const q = query(
      collection(db, 'profiles'),
      orderBy('createdAt', 'desc'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(25),
    );
    const result = await getDocs(q);
    const members = await Promise.all(
      result.docs.map(async (item) => {
        const access = await getDoc(doc(db, 'access', item.id));
        return {
          uid: item.id,
          username: String(item.data().username),
          role: (access.exists() ? access.data().role : 'member') as Role,
        };
      }),
    );
    return { members, cursor: result.docs.at(-1), more: result.size === 25 };
  },
  async setRole(uid: string, role: 'member' | 'admin') {
    current();
    await setDoc(doc(db, 'access', uid), { role });
  },
  async deleteAccount(password: string) {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('Sign in first.');
    // Reauthenticate before deleting any records; a wrong password must not erase progress.
    await reauthenticateWithCredential(
      u,
      EmailAuthProvider.credential(u.email, password),
    );
    await runTransaction(db, async (tx) => {
      const accessRef = doc(db, 'access', u.uid);
      const markerRef = doc(db, 'deletions', u.uid);
      const access = await tx.get(accessRef);
      const marker = await tx.get(markerRef);
      if (access.exists() && access.data().role === 'owner')
        throw new Error(
          'Transfer the owner role in the Firebase console before deleting this account.',
        );
      // A server-enforced marker also blocks token refreshes in other browser tabs.
      if (!marker.exists()) tx.set(markerRef, { deletedAt: serverTimestamp() });
      tx.delete(doc(db, 'plans', u.uid));
      tx.delete(doc(db, 'profiles', u.uid));
      tx.delete(accessRef);
    });
    // If Auth deletion fails after data deletion, the user can retry this idempotent cleanup.
    await deleteUser(u);
  },
};
export type CloudRuntime = typeof runtime;
