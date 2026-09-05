import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { pageInfo } from './lib/pages';

const site = JSON.parse(readFileSync(resolve('pages/site.json'), 'utf8'));
export default defineConfig(({ isSsrBuild }) => ({
  root: resolve('pages'),
  base: site.base,
  publicDir: false,
  plugins: [react()],
  resolve: { alias: { '@': resolve('.') } },
  css: { postcss: { plugins: [tailwind()] } },
  build: isSsrBuild
    ? {
        outDir: resolve('work/pages-ssr'),
        emptyOutDir: true,
        ssr: resolve('pages/render.tsx'),
      }
    : {
        outDir: resolve('dist-pages'),
        emptyOutDir: true,
        rolldownOptions: {
          input: Object.fromEntries(
            Object.entries(pageInfo).map(([name, page]) => [
              name,
              resolve('pages', page.path, 'index.html'),
            ]),
          ),
          output: {
            codeSplitting: {
              groups: [
                {
                  name: 'three',
                  test: /node_modules[\\/]three[\\/]/,
                  maxSize: 250000,
                  priority: 10,
                },
                {
                  name: 'react',
                  test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                  priority: 20,
                },
              ],
            },
          },
        },
      },
}));
