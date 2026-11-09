// Build step: after Vite has built the app, save a plain-HTML copy of every public page (and a
// fresh sitemap.xml) into the build folder, so crawlers that do not run JavaScript still get each
// page's real text, links, title, description and structured data.
//
// It only ADDS files and rewrites dist/index.html's head and root. If anything goes wrong (for
// example the course list cannot be fetched) the build still succeeds with what it has and says
// so in the log. Set PRERENDER=0 to skip it entirely. PRERENDER_API_URL overrides where the course
// list is read from (default: the same API address the app uses).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SNAPSHOT_CSS = '.seo-snapshot{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:46rem;margin:0 auto;padding:4rem 1.25rem;line-height:1.6;color:#e5e7eb;background:#000;min-height:100vh}.seo-snapshot a{color:#f87171}.seo-snapshot ul,.seo-snapshot ol{padding-left:1.25rem}.seo-snapshot nav ul{list-style:none;display:flex;gap:1rem;flex-wrap:wrap;padding:0}';

export default function prerender({ apiUrl } = {}) {
  let outDir = '';
  return {
    name: 'ach-prerender',
    configResolved(cfg) { outDir = path.resolve(cfg.root, cfg.build.outDir); },
    // Production runs `vite preview`, which would answer /courses/ai-for-hr with the home file.
    // Hand out the saved page for that address instead (same as the address with a trailing slash).
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          if (req.method !== 'GET' && req.method !== 'HEAD') return next();
          const u = (req.url || '').split('?')[0];
          if (u === '/' || u.includes('..') || path.extname(u)) return next();
          const rel = u.replace(/^\/+|\/+$/g, '');
          if (!rel) return next();
          const file = path.join(outDir, rel, 'index.html');
          if (!file.startsWith(outDir) || !fs.existsSync(file)) return next();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          if (req.method === 'HEAD') return res.end();
          res.end(fs.readFileSync(file));
        } catch (e) { next(); }
      });
    },
    closeBundle: {
      sequential: true,
      order: 'pre', // before the PWA plugin lists the files it should cache
      async handler() {
        if (process.env.PRERENDER === '0') { console.log('[prerender] skipped (PRERENDER=0)'); return; }
        try { await run(outDir, process.env.PRERENDER_API_URL || apiUrl); } catch (e) { console.warn('[prerender] FAILED, the site is built without saved pages:', e && e.message ? e.message : e); }
      },
    },
  };
}

async function fetchCourses(apiUrl) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/courses`, { signal: ctl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('unexpected response');
    return data.filter((c) => c && !c.legacy).sort((x, y) => x.id - y.id);
  } finally { clearTimeout(timer); }
}

function headHtml(meta, buildHead) {
  const parts = [`<title>${escText(meta.title)}</title>`];
  for (const t of buildHead(meta)) {
    const attrs = Object.entries({ ...t.attrs, 'data-seo': t.key }).map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ');
    if (t.tag === 'script') parts.push(`<script ${attrs}>${String(t.text).replace(/</g, '\\u003c')}</script>`);
    else parts.push(`<${t.tag} ${attrs}>`);
  }
  return parts.join('\n    ');
}

function render(template, meta, snapshot, expectedPath, buildHead) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(?:name|property)="(?:title|description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  const style = snapshot ? `\n    <style>${SNAPSHOT_CSS}</style>` : '';
  html = html.replace('</head>', `    ${headHtml(meta, buildHead)}${style}\n  </head>`);
  if (!/<div id="root"><\/div>/.test(html)) throw new Error('could not find <div id="root"></div> in index.html');
  const guard = snapshot
    ? `<script>if(location.pathname.replace(/\\/+$/,'')!=='${expectedPath === '/' ? '' : expectedPath}'){var r=document.getElementById('root');if(r)r.innerHTML='';}</script>`
    : '';
  html = html.replace('<div id="root"></div>', `<div id="root">${snapshot || ''}</div>${guard}`);
  return html;
}

async function run(outDir, apiUrl) {
  const metaMod = await import(pathToFileURL(path.resolve('src/seo/meta.js')).href);
  const snapMod = await import(pathToFileURL(path.resolve('src/seo/snapshot.js')).href);
  const { PAGES, NOINDEX_PAGES, COURSE_SEO_TITLES, COURSE_PAGES_LASTMOD, SITE_URL, metaForStaticPath, metaForCourse, buildHead } = metaMod;
  const { snapshotFor, courseSnapshot } = snapMod;

  const indexPath = path.join(outDir, 'index.html');
  const template = fs.readFileSync(indexPath, 'utf8');

  let courses = [];
  let courseSource = 'live course list';
  try { courses = await fetchCourses(apiUrl); } catch (e) { courseSource = 'none'; console.warn(`[prerender] could not fetch the course list (${e.message}); course pages are not saved this build`); }
  const withSlug = courses.filter((c) => c.slug);
  if (courses.length && withSlug.length !== courses.length) console.warn('[prerender] some courses have no slug (backend not updated yet?); they are skipped');

  const write = (urlPath, html) => {
    const file = urlPath === '/' ? indexPath : path.join(outDir, urlPath.replace(/^\//, ''), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  };

  // public pages
  for (const p of Object.keys(PAGES)) {
    write(p, render(template, metaForStaticPath(p), snapshotFor(p, withSlug), p, buildHead));
  }
  // pages that must stay out of search: head only
  for (const p of Object.keys(NOINDEX_PAGES)) {
    write(p, render(template, metaForStaticPath(p), '', p, buildHead));
  }
  // course pages
  for (const c of withSlug) {
    write(`/courses/${c.slug}`, render(template, metaForCourse(c), courseSnapshot(c, withSlug), `/courses/${c.slug}`, buildHead));
  }

  // sitemap
  const urls = Object.entries(PAGES).map(([p, v]) => ({ loc: SITE_URL + (p === '/' ? '/' : p), lastmod: v.lastmod, changefreq: v.changefreq, priority: v.priority }));
  const slugs = withSlug.length ? withSlug.map((c) => c.slug) : Object.keys(COURSE_SEO_TITLES);
  for (const s of slugs) urls.push({ loc: `${SITE_URL}/courses/${s}`, lastmod: COURSE_PAGES_LASTMOD, changefreq: 'monthly', priority: '0.8' });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url>\n    <loc>${xmlEsc(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);

  console.log(`[prerender] saved ${Object.keys(PAGES).length} pages, ${Object.keys(NOINDEX_PAGES).length} no-index pages and ${withSlug.length} course pages (source: ${courseSource}); sitemap lists ${urls.length} addresses`);
}
