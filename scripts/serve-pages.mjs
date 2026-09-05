import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist-pages');
const { base } = JSON.parse(await readFile('pages/site.json', 'utf8'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    if (pathname === base.slice(0, -1)) {
      res.writeHead(301, { location: base });
      res.end();
      return;
    }
    if (!pathname.startsWith(base)) throw new Error('Not found');
    let file = resolve(root, pathname.slice(base.length));
    if (file !== root && !file.startsWith(root + sep))
      throw new Error('Not found');
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { location: pathname + '/' });
        res.end();
        return;
      }
      file = resolve(file, 'index.html');
    }
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(resolve(root, '404.html')));
  }
}).listen(4173, '127.0.0.1', () =>
  console.log(`Revision Grove: http://127.0.0.1:4173${base}`),
);
