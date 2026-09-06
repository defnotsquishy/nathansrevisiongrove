// Local-only fixture. The owner's real public configuration is restored even if building fails.
import { readFile, writeFile, cp } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
if (process.env.CI)
  throw new Error('Do not build a browser emulator fixture in publication CI.');
const original = await readFile('pages/cloud.json');
try {
  await writeFile(
    'pages/cloud.json',
    JSON.stringify({
      enabled: true,
      firebase: {
        apiKey: 'AIza' + 'a'.repeat(35),
        projectId: 'demo-revision-grove',
        authDomain: 'demo-revision-grove.firebaseapp.com',
        appId: '1:123456789:web:abcdef123456',
      },
      privacyEmail: 'test@example.test',
    }),
  );
  const result = spawnSync(process.execPath, ['scripts/build-pages.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_GROVE_EMULATORS: 'true' },
  });
  if (result.status !== 0) throw new Error('Emulator fixture build failed.');
  await cp('dist-pages', 'work/cloud-preview', { recursive: true });
} finally {
  await writeFile('pages/cloud.json', original);
}
console.log(
  'Local fixture is in work/cloud-preview. Rebuild normally before publishing.',
);
