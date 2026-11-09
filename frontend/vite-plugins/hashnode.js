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
const QUERY_FULL = listQuery('updatedAt seo { title description }');
const QUERY_BASIC = listQuery('');

async function ask(endpoint, query, variables) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }), signal: ctrl.signal });
    if (!res.ok && res.status !== 400) throw new Error(`Hashnode answered HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

export async function fetchHashnodePosts({ host, apiUrl } = {}) {
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
