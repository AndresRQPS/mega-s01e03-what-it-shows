import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

// Build config added to render the export locally; the `support` repo's own config was not exported.
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook } })],
  kit: {
    adapter: adapter({ pages: 'build', assets: 'build', strict: false }),
    alias: { '#lib': 'src/lib' },
    prerender: { handleHttpError: 'warn', entries: ['/kb', '/kb/incidents/4471', '/kb/incidents/4471/problems', '/kb/triage/dedupe', '/kb/decisions/0001-dedupe-by-subject'] },
  },
};
