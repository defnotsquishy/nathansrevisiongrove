import { build } from 'vite';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const site = JSON.parse(await readFile('pages/site.json', 'utf8'));
if (!/^\/[a-z0-9/-]*\/$|^\/$/.test(site.base))
  throw new Error('Site base must start and end with /.');
const origin = new URL(site.origin).origin;
if (
  site.customDomain &&
  (new URL('https://' + site.customDomain).hostname !== site.customDomain ||
    !site.customDomain.includes('.'))
)
  throw new Error('Use a full domain you own.');
if (
  site.customDomain &&
  (origin !== 'https://' + site.customDomain || site.base !== '/')
)
  throw new Error(
    'Custom domains require a matching HTTPS origin and root base /.',
  );
const esc = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const sources = new Set();
async function trace(file) {
  if (sources.has(file)) return;
  sources.add(file);
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(
    /(?:from\s*|import\s*\()['"]([@.][^'"]+)['"]/g,
  )) {
    const target = match[1].startsWith('@/')
      ? resolve(match[1].slice(2))
      : resolve(dirname(file), match[1]);
    for (const extension of ['.tsx', '.ts']) {
      try {
        await readFile(target + extension);
      } catch {
        continue;
      }
      await trace(target + extension);
      break;
    }
  }
}
await trace(resolve('components/grove-app.tsx'));
const sourceRules = [...sources]
  .map(
    (file) =>
      `@source '${relative(resolve('pages'), file).replaceAll('\\', '/')}';`,
  )
  .join('\n');
const css = (await readFile('app/globals.css', 'utf8'))
  .replace("@import 'tailwindcss';", "@import 'tailwindcss' source(none);")
  .replace(
    "@import 'shadcn/tailwind.css';",
    "@import 'shadcn/tailwind.css';\n" + sourceRules,
  );
await writeFile(
  'pages/styles.css',
  css +
    '\n:root{--font-geist-sans:Arial,sans-serif;--font-geist-mono:monospace}.skip-link{position:fixed;top:8px;left:8px;z-index:100;background:#d2f59b;color:#101411;padding:12px 20px;transform:translateY(-150%)}.skip-link:focus{transform:none}',
);
await build({
  configFile: resolve('vite.pages.config.ts'),
  build: { ssr: resolve('pages/render.tsx') },
});
const { render, pageInfo } = await import(
  pathToFileURL(resolve('work/pages-ssr/render.js')).href
);
for (const [view, page] of Object.entries(pageInfo)) {
  const url = origin + site.base + page.path;
  const title = `${page.title} | Nathan’s Revision Grove`;
  const crumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Revision Grove',
      item: origin + site.base,
    },
  ];
  if (page.path)
    crumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: page.title,
      item: url,
    });
  const html = `<!doctype html><html lang="en-GB" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(page.description)}"><meta name="theme-color" content="#101411"><link rel="icon" href="${site.base}favicon.svg" type="image/svg+xml"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs })}</script></head><body><a href="#main-content" class="skip-link">Skip to content</a><div id="root" data-view="${esc(view)}" data-base="${site.base}">${await render(view, site.base)}</div><noscript><p>Enable JavaScript to edit your timetable and save progress. Revision resource links remain available.</p></noscript><script type="module" src="/client.tsx"></script></body></html>`;
  await mkdir(resolve('pages', page.path), { recursive: true });
  await writeFile(resolve('pages', page.path, 'index.html'), html);
}
await build({ configFile: resolve('vite.pages.config.ts') });
await copyFile('public/favicon.svg', 'dist-pages/favicon.svg');
await writeFile('dist-pages/.nojekyll', '');
await writeFile(
  'dist-pages/robots.txt',
  `User-agent: *\nAllow: /\n\nSitemap: ${origin}${site.base}sitemap.xml\n`,
);
await writeFile(
  'dist-pages/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.values(
    pageInfo,
  )
    .map((page) => `<url><loc>${origin}${site.base}${page.path}</loc></url>`)
    .join('')}</urlset>`,
);
if (site.customDomain)
  await writeFile('dist-pages/CNAME', site.customDomain + '\n');
await writeFile(
  'dist-pages/404.html',
  `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Nathan’s Revision Grove</title><link rel="icon" href="${site.base}favicon.svg" type="image/svg+xml"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101411;color:#f2f4ec;font:18px/1.6 Arial,sans-serif}main{max-width:650px;padding:32px}small{color:#d2f59b;letter-spacing:.15em}h1{font-size:clamp(38px,7vw,70px);line-height:1.05}a{display:inline-block;margin:12px 16px 0 0;padding:12px 20px;border:1px solid #d2f59b;border-radius:8px;color:#d2f59b}a:first-of-type{background:#d2f59b;color:#101411}a:focus-visible{outline:3px solid white;outline-offset:4px}</style></head><body><main><small>REVISION GROVE · 404</small><h1>This path stops here.</h1><p>The page may have moved, or the address might contain a typo. Your saved revision progress is still on this device.</p><a href="${site.base}">Back to my dashboard</a><a href="${site.base}timetable/">Open my timetable</a></main></body></html>`,
);
console.log(
  `Built ${Object.keys(pageInfo).length} static pages, sitemap, robots, favicon and custom 404 in dist-pages.`,
);
