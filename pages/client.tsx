import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import PublicSite, { isPublicView } from '../components/public-site';
const GroveApp = lazy(() => import('../components/grove-app'));
import { pageInfo, type View } from '../lib/pages';
import './styles.css';
import './public.css';

const root = document.getElementById('root')!;
const view = root.dataset.view as View;
createRoot(root).render(
  isPublicView(view) ? (
    <PublicSite view={view} base={root.dataset.base || '/'} />
  ) : (
    <Suspense
      fallback={
        <p className="workspace-loading">Opening your revision workspace…</p>
      }
    >
      <GroveApp
        initialView={view in pageInfo ? view : 'Today'}
        pagesBase={root.dataset.base}
      />
    </Suspense>
  ),
);
