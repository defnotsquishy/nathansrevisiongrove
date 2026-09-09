import { build } from 'vite';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateCloud, securePages } from './secure-pages.mjs';

const site = JSON.parse(await readFile('pages/site.json', 'utf8'));
const cloud = await validateCloud();
await import('./build-public-assets.mjs');
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
await trace(resolve('components/public-site.tsx'));
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
    '\n:root{--font-geist-sans:Arial,sans-serif;--font-geist-mono:monospace}.skip-link{position:fixed;top:8px;left:8px;z-index:100;background:#f2a368;color:#120f0d;padding:12px 20px;transform:translateY(-150%)}.skip-link:focus{transform:none}',
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
  const socialImage = origin + site.base + 'og.png';
  const publicMetadata = `<meta property="og:image" content="${socialImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Nathan’s Revision Grove: Plan your revision. Practise the maths."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(page.description)}"><meta name="twitter:image" content="${socialImage}"><meta name="twitter:image:alt" content="Nathan’s Revision Grove: Plan your revision. Practise the maths.">`;
  const siteSchema =
    view === 'Home'
      ? `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': url + '#website',
              name: 'Nathan’s Revision Grove',
              url,
              inLanguage: 'en-GB',
              description: page.description,
              creator: { '@type': 'Person', name: 'Nathan Yu' },
            },
            {
              '@type': 'WebApplication',
              name: 'Nathan’s Revision Grove',
              url,
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web browser',
              isAccessibleForFree: true,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
              description: page.description,
            },
          ],
        })}</script>`
      : '';
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
  const html = `<!doctype html><html lang="en-GB" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(page.description)}"><meta name="theme-color" content="#120f0d">${view === 'Admin' || view === 'Account' ? '<meta name="robots" content="noindex,nofollow">' : ''}<link rel="icon" href="${site.base}favicon.svg" type="image/svg+xml"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs })}</script></head><body><a href="#main-content" class="skip-link">Skip to content</a><div id="root" data-view="${esc(view)}" data-base="${site.base}">${await render(view, site.base)}</div><noscript><p>Enable JavaScript to edit your timetable and save progress. Revision resource links remain available.</p></noscript><script type="module" src="/client.tsx"></script></body></html>`;
  await mkdir(resolve('pages', page.path), { recursive: true });
  await writeFile(
    resolve('pages', page.path, 'index.html'),
    html.replace('</head>', publicMetadata + siteSchema + '</head>'),
  );
}
await build({ configFile: resolve('vite.pages.config.ts') });
await copyFile('public/favicon.svg', 'dist-pages/favicon.svg');
await copyFile('public/og.png', 'dist-pages/og.png');
await writeFile('dist-pages/.nojekyll', '');
await writeFile(
  'dist-pages/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: ${site.base}admin/\n\nSitemap: ${origin}${site.base}sitemap.xml\n`,
);
await writeFile(
  'dist-pages/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.values(
    pageInfo,
  )
    .filter((page) => !['account/', 'admin/'].includes(page.path))
    .map((page) => `<url><loc>${origin}${site.base}${page.path}</loc></url>`)
    .join('')}</urlset>`,
);
if (site.customDomain)
  await writeFile('dist-pages/CNAME', site.customDomain + '\n');
await writeFile(
  'dist-pages/404.html',
  `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="description" content="This Revision Grove page could not be found. Return home or open your revision dashboard."><title>Page not found | Nathan’s Revision Grove</title><link rel="icon" href="${site.base}favicon.svg" type="image/svg+xml"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#120f0d;color:#fff1df;font:18px/1.6 Arial,sans-serif}main{max-width:650px;padding:32px}small{color:#f2a368;letter-spacing:.15em}h1{font-size:clamp(38px,7vw,70px);line-height:1.05}a{display:inline-block;margin:12px 16px 0 0;padding:12px 20px;border:1px solid #f2a368;border-radius:5px;color:#f2a368}a:first-of-type{background:#f2a368;color:#120f0d}a:hover{background:#3d3229}a:focus-visible{outline:3px solid white;outline-offset:4px}</style></head><body><main><small>REVISION GROVE · 404</small><h1>Page not found.</h1><p>The page may have moved, or the address might contain a typo. Opening a missing page does not change your saved revision plan.</p><a href="${site.base}">Back to home</a><a href="${site.base}dashboard/">Open my dashboard</a></main></body></html>`,
);
console.log(
  `Built ${Object.keys(pageInfo).length} static pages, sitemap, robots, favicon and custom 404 in dist-pages.`,
);
await securePages(resolve('dist-pages'), cloud);
