import { createRoot } from 'react-dom/client';
import GroveApp from '../components/grove-app';
import { pageInfo, type View } from '../lib/pages';
import './styles.css';

const root = document.getElementById('root')!;
const view = root.dataset.view as View;
createRoot(root).render(
  <GroveApp
    initialView={view in pageInfo ? view : 'Today'}
    pagesBase={root.dataset.base}
  />,
);
