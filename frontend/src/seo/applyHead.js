// Updates the live page's <head> when someone moves between pages inside the app.
// The same tags are written into the page at build time (see vite-plugins/prerender.js); each is
// marked data-seo="<key>" so it is replaced, never duplicated.
import { buildHead } from './meta.js';

const ALL_KEYS = ['description', 'title-meta', 'robots', 'canonical', 'og-url', 'og-type', 'og-site', 'og-title', 'og-desc', 'og-image', 'tw-card', 'tw-title', 'tw-desc', 'tw-image', 'jsonld'];

export function applyHead(meta, { setTitle = true } = {}) {
  if (typeof document === 'undefined' || !meta) return;
  if (setTitle && meta.title) document.title = meta.title;
  const wanted = new Map(buildHead(meta).map((t) => [t.key, t]));
  ALL_KEYS.forEach((key) => {
    const t = wanted.get(key);
    // Remove tags of this kind that are not ours (the fixed ones the page shipped with) and ours that are no longer wanted.
    const probe = t ? t.sel : null;
    document.head.querySelectorAll(`[data-seo="${key}"]`).forEach((el) => { if (!t) el.remove(); });
    if (!t) return;
    document.head.querySelectorAll(probe).forEach((el) => { if (el.getAttribute('data-seo') !== key) el.remove(); });
    let el = document.head.querySelector(`[data-seo="${key}"]`);
    if (!el) { el = document.createElement(t.tag); el.setAttribute('data-seo', key); document.head.appendChild(el); }
    Object.entries(t.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (t.text !== undefined) el.textContent = t.text;
  });
}

// For pages that are not public (dashboard, certificates, ...): keep them out of search, leave the title alone.
export function applyPrivateHead() {
  applyHead({ title: null, description: null, path: null, noindex: true, image: null, jsonLd: null }, { setTitle: false });
}
