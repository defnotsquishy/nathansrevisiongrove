import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export async function validateCloud() {
  if (process.env.VITE_GROVE_EMULATORS === 'true' && process.env.CI)
    throw new Error('Emulator builds must never be published by CI.');
  const cloud = JSON.parse(await readFile('pages/cloud.json', 'utf8'));
  if (
    Object.keys(cloud).some(
      (k) => !['enabled', 'firebase', 'privacyEmail'].includes(k),
    )
  )
    throw new Error(
      'Unexpected cloud configuration. Never add private credentials.',
    );
  if (
    Object.keys(cloud.firebase).some(
      (k) => !['apiKey', 'authDomain', 'projectId', 'appId'].includes(k),
    )
  )
    throw new Error(
      'Use only the four public Firebase web configuration values.',
    );
  if (cloud.enabled) {
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(cloud.firebase.projectId))
      throw new Error('Use a valid Firebase projectId.');
    if (!/^AIza[A-Za-z0-9_-]{30,50}$/.test(cloud.firebase.apiKey))
      throw new Error('Use a public Firebase web API key, not a private key.');
    if (
      cloud.firebase.authDomain !==
      cloud.firebase.projectId + '.firebaseapp.com'
    )
      throw new Error('Use the default Firebase authDomain for this project.');
    if (!/^1:\d+:web:[A-Za-z0-9]+$/.test(cloud.firebase.appId))
      throw new Error('Use the Firebase web appId.');
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(cloud.privacyEmail))
      throw new Error(
        'Add a valid public privacy email before enabling accounts.',
      );
  }
  return cloud;
}
export async function securePages(directory, cloud) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await securePages(file, cloud);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    let html = await readFile(file, 'utf8');
    const hashes = [
      ...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
    ].map(
      (m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`,
    );
    const connects =
      process.env.VITE_GROVE_EMULATORS === 'true'
        ? ' http://127.0.0.1:9099 http://127.0.0.1:8085'
        : cloud.enabled
          ? ' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com'
          : '';
    const frames = cloud.enabled
      ? 'https://' + cloud.firebase.authDomain
      : "'none'";
    const policy = `default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'${connects}; frame-src ${frames}; object-src 'none'; base-uri 'none'; form-action 'self'`;
    html = html.replace(
      /(<head>)/,
      `$1<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="same-origin">`,
    );
    await writeFile(file, html);
  }
}
