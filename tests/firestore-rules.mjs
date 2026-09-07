import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const env = await initializeTestEnvironment({
  projectId: 'demo-revision-grove',
  firestore: {
    host: '127.0.0.1',
    port: 8085,
    rules: await readFile('firestore.rules', 'utf8'),
  },
});
const db = (uid) =>
  env
    .authenticatedContext(uid, {
      email_verified: true,
      email: uid + '@example.test',
    })
    .firestore();
try {
  await env.clearFirestore();
  const alice = db('alice'),
    bob = db('bob'),
    admin = db('admin'),
    owner = db('owner');
  const guest = env.unauthenticatedContext().firestore();
  const unverified = env
    .authenticatedContext('unverified', { email_verified: false })
    .firestore();
  for (const [uid, store] of [
    ['alice', alice],
    ['bob', bob],
    ['admin', admin],
    ['owner', owner],
  ])
    await assertSucceeds(
      setDoc(doc(store, 'profiles', uid), {
        username: uid,
        createdAt: serverTimestamp(),
      }),
    );
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'access', 'owner'), { role: 'owner' });
    await setDoc(doc(c.firestore(), 'access', 'admin'), { role: 'admin' });
  });
  const payload = {
    payload: JSON.stringify({ test: 'private revision note' }),
    revision: 1,
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(alice, 'plans', 'alice'), payload));
  await assertSucceeds(getDoc(doc(alice, 'plans', 'alice')));
  await assertFails(getDoc(doc(bob, 'plans', 'alice')));
  await assertFails(getDoc(doc(admin, 'plans', 'alice')));
  await assertFails(getDoc(doc(owner, 'plans', 'alice')));
  await assertFails(getDoc(doc(guest, 'plans', 'alice')));
  await assertFails(
    setDoc(doc(unverified, 'profiles', 'unverified'), {
      username: 'Unverified',
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(bob, 'plans', 'alice'), { ...payload, revision: 2 }),
  );
  await assertFails(
    setDoc(doc(alice, 'plans', 'alice'), { ...payload, revision: 1 }),
  );
  await assertFails(
    setDoc(doc(alice, 'plans', 'alice'), { ...payload, revision: 3 }),
  );
  await assertSucceeds(
    setDoc(doc(alice, 'plans', 'alice'), { ...payload, revision: 2 }),
  );
  await assertFails(
    setDoc(doc(bob, 'plans', 'bob'), { ...payload, owner: 'alice' }),
  );
  await assertFails(
    setDoc(doc(bob, 'plans', 'bob'), {
      ...payload,
      payload: 'x'.repeat(700001),
    }),
  );
  await assertFails(setDoc(doc(bob, 'access', 'bob'), { role: 'owner' }));
  await assertFails(setDoc(doc(bob, 'access', 'bob'), { role: 'admin' }));
  await assertFails(updateDoc(doc(bob, 'profiles', 'bob'), { role: 'admin' }));
  await assertFails(setDoc(doc(admin, 'access', 'bob'), { role: 'admin' }));
  await assertSucceeds(setDoc(doc(owner, 'access', 'bob'), { role: 'admin' }));
  await assertSucceeds(getDocs(query(collection(bob, 'profiles'), limit(25))));
  await assertFails(getDocs(collection(bob, 'profiles')));
  await assertFails(getDocs(query(collection(bob, 'profiles'), limit(26))));
  await assertFails(getDocs(collection(alice, 'profiles')));
  await assertFails(getDocs(collection(owner, 'plans')));
  await assertFails(setDoc(doc(owner, 'access', 'bob'), { role: 'owner' }));
  await assertFails(setDoc(doc(owner, 'access', 'owner'), { role: 'member' }));
  await assertFails(deleteDoc(doc(owner, 'access', 'owner')));
  await assertFails(deleteDoc(doc(owner, 'profiles', 'owner')));
  await assertFails(
    setDoc(doc(owner, 'access', 'missing-user'), { role: 'admin' }),
  );
  await assertSucceeds(setDoc(doc(owner, 'access', 'bob'), { role: 'member' }));
  await assertFails(getDocs(query(collection(bob, 'profiles'), limit(25))));
  await assertFails(deleteDoc(doc(admin, 'profiles', 'alice')));
  const deletion = writeBatch(alice);
  deletion.set(doc(alice, 'deletions', 'alice'), {
    deletedAt: serverTimestamp(),
  });
  deletion.delete(doc(alice, 'profiles', 'alice'));
  deletion.delete(doc(alice, 'plans', 'alice'));
  deletion.delete(doc(alice, 'access', 'alice'));
  await assertSucceeds(deletion.commit());
  assert.equal((await getDoc(doc(alice, 'profiles', 'alice'))).exists(), false);
  // The original cached verified token must not resurrect an erased account.
  await assertFails(
    setDoc(doc(alice, 'profiles', 'alice'), {
      username: 'Resurrected',
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(setDoc(doc(alice, 'plans', 'alice'), payload));
  await assertFails(deleteDoc(doc(alice, 'deletions', 'alice')));
  await assertFails(
    updateDoc(doc(alice, 'deletions', 'alice'), {
      deletedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(bob, 'deletions', 'alice')));
  await assertFails(
    setDoc(doc(owner, 'deletions', 'owner'), { deletedAt: serverTimestamp() }),
  );
  const recreate = writeBatch(bob);
  recreate.set(doc(bob, 'deletions', 'bob'), { deletedAt: serverTimestamp() });
  recreate.set(doc(bob, 'profiles', 'bob'), {
    username: 'Still here',
    createdAt: serverTimestamp(),
  });
  await assertFails(recreate.commit());
  // Use a fresh UID too: failure must not rely on the profile-update prohibition.
  const fresh = db('atomic-recreation');
  const atomic = writeBatch(fresh);
  atomic.set(doc(fresh, 'deletions', 'atomic-recreation'), {
    deletedAt: serverTimestamp(),
  });
  atomic.set(doc(fresh, 'profiles', 'atomic-recreation'), {
    username: 'New profile',
    createdAt: serverTimestamp(),
  });
  await assertFails(atomic.commit());
  // Cleanup retries remain allowed, but the marker itself stays immutable.
  await assertSucceeds(deleteDoc(doc(alice, 'profiles', 'alice')));
  await assertSucceeds(deleteDoc(doc(alice, 'plans', 'alice')));
  await assertSucceeds(getDoc(doc(alice, 'deletions', 'alice')));
  await assertFails(
    setDoc(doc(alice, 'arbitrary', 'document'), { public: true }),
  );
  console.log(
    'Passed Firestore authorization checks: private plans, verified writes, revision conflicts, size limits, bounded directory, role escalation/revocation, protected owner, own-account deletion and default deny.',
  );
} finally {
  await env.cleanup();
}
