import { hydrateRoot } from 'react-dom/client';
import PublicSite, { isPublicView } from '../components/public-site';
import GroveApp from '../components/grove-app';
import { pageInfo, type View } from '../lib/pages';
import './styles.css';
import './public.css';

const root = document.getElementById('root')!;
const view = root.dataset.view as View;
hydrateRoot(
  root,
  isPublicView(view) ? (
    <PublicSite view={view} base={root.dataset.base || '/'} />
  ) : (
    <GroveApp
      initialView={view in pageInfo ? view : 'Today'}
      pagesBase={root.dataset.base}
    />
  ),
);
