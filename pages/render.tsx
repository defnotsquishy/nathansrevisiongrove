import { renderToPipeableStream } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import GroveApp from '../components/grove-app';
import PublicSite, { isPublicView } from '../components/public-site';
export { pageInfo } from '../lib/pages';
import type { View } from '../lib/pages';

export function render(view: View, base: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = '';
    output.on('data', (chunk) => {
      html += chunk.toString();
    });
    output.on('end', () => resolve(html));
    const stream = renderToPipeableStream(
      isPublicView(view) ? (
        <PublicSite view={view} base={base} />
      ) : (
        <GroveApp initialView={view} pagesBase={base} />
      ),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
