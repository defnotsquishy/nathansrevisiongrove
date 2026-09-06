import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
await build({
  configFile: false,
  logLevel: 'error',
  build: {
    ssr: resolve('tests/entry.ts'),
    outDir: resolve('work/tests'),
    emptyOutDir: true,
  },
});
const m = await import(pathToFileURL(resolve('work/tests/entry.js')).href);
const data = new Map();
const storage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value),
};
Object.defineProperty(globalThis, 'localStorage', { value: storage });
const fresh = m.readDevicePlan();
assert.equal(fresh.state.settings.name, 'Student');
const today = '2026-09-05';
const initial = m.emptyState(today);
const plan = m.makePlan(initial, initial.settings, today);
assert.equal(plan.sessions.length, 106);
assert.equal(new Set(plan.sessions.map((s) => s.topicId)).size, 106);
assert.ok(plan.sessions.every((s) => !m.overlaps(plan.sessions, s)));
const state = { ...initial, sessions: plan.sessions };
const saved = m.writeDevicePlan(state, 0);
assert.deepEqual(m.readDevicePlan(), saved);
assert.throws(() => m.writeDevicePlan(state, 0), /another tab/);
const done = m.finishSession(
  state,
  plan.sessions[0],
  3,
  'Remember both terms.',
  25,
  today,
);
assert.equal(done.logs.length, 1);
assert.equal(
  m.finishSession(done, plan.sessions[0], 3, 'Duplicate', 25, today).logs
    .length,
  1,
);
const file = new File(
  [JSON.stringify({ format: 'revision-grove', version: 1, state: done })],
  'backup.json',
  { type: 'application/json' },
);
assert.deepEqual(await m.readBackup(file), done);
assert.deepEqual(m.restoreDevicePlan(done).state, done);
await assert.rejects(() => m.readBackup(new File(['{}'], 'invalid.json')));
await assert.rejects(() =>
  m.readBackup(new File(['not json'], 'invalid.json')),
);
data.set('revision-grove-plan-v1', 'broken');
assert.throws(() => m.readDevicePlan(), /not been replaced/);
assert.equal(data.get('revision-grove-plan-v1'), 'broken');
assert.deepEqual(m.restoreDevicePlan(done).state, done);
storage.setItem = () => {
  throw new Error('Quota');
};
assert.throws(
  () => m.writeDevicePlan(state, m.readDevicePlan().revision),
  /could not save/,
);
const titles = new Set();
for (const page of Object.values(m.pageInfo)) {
  const html = await readFile(
    resolve('dist-pages', page.path, 'index.html'),
    'utf8',
  );
  assert.equal([...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length, 1);
  assert.ok(html.includes(page.title));
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  assert.ok(!titles.has(title));
  titles.add(title);
  assert.ok(html.includes('name="description"'));
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(html.includes('BreadcrumbList'));
  assert.ok(!html.includes('Switched to client rendering'));
  for (const image of html.matchAll(/<img\b[^>]*>/g))
    assert.match(image[0], /\balt=/);
  for (const resource of html.matchAll(
    /(?:src|href)="(\/nathansrevisiongrove\/[^"#?]*)"/g,
  )) {
    let file = resource[1].replace('/nathansrevisiongrove/', '');
    if (!file || file.endsWith('/')) file += 'index.html';
    assert.ok((await stat(resolve('dist-pages', file))).isFile(), file);
  }
}
for (const name of [
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
  '.nojekyll',
])
  assert.ok((await stat(resolve('dist-pages', name))).isFile());
for (const name of await readdir('dist-pages/assets'))
  if (name.endsWith('.js'))
    assert.ok(
      (await stat(resolve('dist-pages/assets', name))).size < 500000,
      `Bundle too large: ${name}`,
    );
console.log(
  'Passed: timetable scheduling, duplicate completion, device persistence, conflicts, backup validation/recovery, storage failures, all static pages, metadata, links and bundle size limits.',
);
