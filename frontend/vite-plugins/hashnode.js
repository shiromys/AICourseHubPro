// Reads the blog's posts from Hashnode (public GraphQL API) while the site is being built.
// Needs no secret: a published blog can be read by anyone.
// HASHNODE_HOST = the blog's address on Hashnode (default blog.aicoursehubpro.com, or the
// xxxx.hashnode.dev address once the subdomain has been moved to this site).
// HASHNODE_API_URL exists only so tests can point at a fake server.

// Two versions of the same question. The first asks for everything we use; if Hashnode rejects a field
// (their API changes now and then) the second asks only for the basics, so the build still gets the posts.
const fields = (extra) => `slug title subtitle brief publishedAt readTimeInMinutes
        coverImage { url }
        author { name }
        tags { name }
        content { html }
        ${extra}`;
const listQuery = (extra) => `query BlogPosts($host: String!, $first: Int!, $after: String) {
  publication(host: $host) {
    title
    posts(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { ${fields(extra)} } }
    }
  }
}`;
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 AICourseHubPro-build';
const QUERY_FULL = listQuery('updatedAt seo { title description }');
const QUERY_BASIC = listQuery('');

async function ask(endpoint, query, variables) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': BROWSER_UA }, body: JSON.stringify({ query, variables }), signal: ctrl.signal });
    if (!res.ok && res.status !== 400) throw new Error(`Hashnode answered HTTP ${res.status}`);
    const text = await res.text();
    try { return JSON.parse(text); } catch (e) {
      const title = /<title[^>]*>([^<]*)<\/title>/i.exec(text);
      throw new Error(`Hashnode did not answer with data (HTTP ${res.status}, ${res.redirected ? 'redirected to ' : 'from '}${res.url}, type ${res.headers.get('content-type') || '?'}, page title "${title ? title[1].trim().slice(0, 80) : text.slice(0, 60).replace(/\s+/g, ' ')}")`);
    }
  } catch (e) {
    const c = e && e.cause && (e.cause.code || e.cause.message);
    throw new Error(e && e.name === 'AbortError' ? 'Hashnode did not answer within 20 seconds' : `${e.message}${c ? ' (' + c + ')' : ''}`);
  } finally { clearTimeout(timer); }
}

async function fetchViaApi({ host, apiUrl } = {}) {
  const endpoint = apiUrl || process.env.HASHNODE_API_URL || 'https://gql.hashnode.com';
  const hostName = String(host || process.env.HASHNODE_HOST || 'blog.aicoursehubpro.com').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const posts = [];
  let after = null;
  let useFull = true;
  const needText = [];
  for (let page = 0; page < 20; page++) {
    let json = await ask(endpoint, useFull ? QUERY_FULL : QUERY_BASIC, { host: hostName, first: 20, after });
    if (useFull && json.errors && json.errors.length && !(json.data && json.data.publication)) {
      useFull = false; // a field was refused: ask again for the basics only
      console.warn('[hashnode] extra fields (updatedAt / seo) were refused; continuing without them: ' + json.errors.map((e) => e.message).join('; ').slice(0, 200));
      json = await ask(endpoint, QUERY_BASIC, { host: hostName, first: 20, after });
    }
    if (json.errors && json.errors.length && !(json.data && json.data.publication)) throw new Error('Hashnode error: ' + json.errors.map((e) => e.message).join('; ').slice(0, 300));
    const pub = json && json.data && json.data.publication;
    if (!pub) throw new Error(`no blog found on Hashnode for host "${hostName}" (set HASHNODE_HOST to the blog's address on Hashnode)`);
    for (const edge of (pub.posts && pub.posts.edges) || []) {
      const n = edge && edge.node;
      if (!n || !n.slug || !n.title) continue;
      if (!n.content || !n.content.html) { needText.push(n.slug); }
      posts.push({
        slug: String(n.slug),
        title: String(n.title),
        subtitle: n.subtitle || '',
        brief: n.brief || '',
        description: (n.seo && n.seo.description) || n.brief || '',
        seoTitle: (n.seo && n.seo.title) || '',
        publishedAt: n.publishedAt || null,
        updatedAt: n.updatedAt || null,
        readTime: n.readTimeInMinutes ? `${n.readTimeInMinutes} min read` : '',
        image: (n.coverImage && n.coverImage.url) || '',
        author: (n.author && n.author.name) || '',
        tags: (n.tags || []).map((t) => t.name).filter(Boolean),
        html: n.content && n.content.html ? String(n.content.html) : '',
      });
    }
    const pi = pub.posts && pub.posts.pageInfo;
    if (!pi || !pi.hasNextPage || !pi.endCursor) break;
    after = pi.endCursor;
  }
  // a post whose text did not come with the list: ask for it by itself
  for (const slug of needText) {
    const j = await ask(endpoint, 'query P($host: String!, $slug: String!) { publication(host: $host) { post(slug: $slug) { content { html } } } }', { host: hostName, slug });
    const html = j && j.data && j.data.publication && j.data.publication.post && j.data.publication.post.content && j.data.publication.post.content.html;
    const target = posts.find((p) => p.slug === slug);
    if (target && html) target.html = String(html);
  }
  const empty = posts.filter((p) => !p.html).map((p) => p.slug);
  if (empty.length) console.warn(`[hashnode] ${empty.length} post(s) came back without text and are left out: ${empty.join(', ')}`);
  return posts.filter((p) => p.html);
}

// ---- second route: the blog's public feed (rss.xml), used when the API cannot be read -----------------
const decode = (t) => String(t).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (block, name) => { const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(block); return m ? m[1].trim() : ''; };

export function parseFeed(xml, hostName) {
  const posts = [];
  for (const m of String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    const item = m[0];
    const link = decode(tag(item, 'link'));
    const slug = (/^https?:\/\/[^/]+\/([^/?#]+)/.exec(link) || [])[1];
    const html = decode(tag(item, 'content:encoded'));
    const title = decode(tag(item, 'title'));
    if (!slug || !title || !html) continue;
    const pub = new Date(decode(tag(item, 'pubDate')));
    const cover = /<enclosure[^>]*\burl="([^"]+)"/i.exec(item);
    posts.push({
      slug, title, subtitle: '', brief: decode(tag(item, 'description')), description: decode(tag(item, 'description')), seoTitle: '',
      publishedAt: isNaN(pub) ? null : pub.toISOString(), updatedAt: null, readTime: '',
      image: cover ? decode(cover[1]) : '', author: decode(tag(item, 'dc:creator')),
      tags: Array.from(item.matchAll(/<category>([\s\S]*?)<\/category>/gi)).map((c) => decode(c[1]).trim()).filter(Boolean), html,
    });
  }
  return posts;
}

async function fetchViaFeed({ host, feedUrl } = {}) {
  const hostName = String(host || process.env.HASHNODE_HOST || 'blog.aicoursehubpro.com').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const url = feedUrl || process.env.HASHNODE_FEED_URL || `https://${hostName}/rss.xml`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const posts = parseFeed(text, hostName);
    if (!posts.length) throw new Error(`no articles with text found in ${url} (type ${res.headers.get('content-type') || '?'})`);
    return posts;
  } catch (e) {
    const c = e && e.cause && (e.cause.code || e.cause.message);
    throw new Error(e && e.name === 'AbortError' ? 'feed did not answer within 20 seconds' : `${e.message}${c ? ' (' + c + ')' : ''}`);
  } finally { clearTimeout(timer); }
}

// The API first; if it cannot be read, the public feed.
export async function fetchHashnodePosts(opts = {}) {
  try {
    return await fetchViaApi(opts);
  } catch (apiError) {
    try {
      const posts = await fetchViaFeed(opts);
      console.warn(`[hashnode] the API could not be read (${apiError.message}); used the public feed instead (${posts.length} posts; update dates and reading times are not available from the feed).`);
      return posts;
    } catch (feedError) {
      throw new Error(`API: ${apiError.message} | feed: ${feedError.message}`);
    }
  }
}
