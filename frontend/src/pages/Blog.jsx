import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BLOG_ARTICLES, BLOG_CATEGORIES } from '../content/blogPosts.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowUpRight, Clock, Tag, Search, Rss } from 'lucide-react';

// The article list lives in content/blogPosts.js. At build time the site also saves /blog-data/index.json
// (the full list, including posts published on Hashnode that are not listed in that file).
const OLD_BLOG = 'https://blog.aicoursehubpro.com';

const toCard = (a) => ({ ...a, excerpt: a.excerpt, readTime: a.readTime });

const categoryColors = {
  'Beginner Guide': 'bg-blue-100 text-blue-700',
  'AI in HR':       'bg-red-100 text-red-700',
  'Career Growth':  'bg-green-100 text-green-700',
  'How-To':         'bg-purple-100 text-purple-700',
  'Industry News':  'bg-yellow-100 text-yellow-700',
};

const Badge = ({ category }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${categoryColors[category] || 'bg-gray-100 text-gray-600'}`}>
    <Tag size={10} />
    {category}
  </span>
);

// Opens the article on this site; only if the saved articles are missing from this build does it fall back to the old address.
const PostLink = ({ article, baked, className, children }) => (
  baked
    ? <Link to={`/blog/${article.slug}`} className={className}>{children}</Link>
    : <a href={`${OLD_BLOG}/${article.slug}`} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
);

const FeaturedCard = ({ article, baked }) => (
  <PostLink article={article} baked={baked}
    className="group block relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 md:p-12 border border-gray-700 hover:border-red-600 transition-all duration-300 overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold uppercase tracking-wide">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Featured Article
        </span>
        <Badge category={article.category} />
      </div>
      <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4 group-hover:text-red-400 transition-colors">
        {article.title}
      </h2>
      <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-2xl">{article.excerpt}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <span className="flex items-center gap-1"><Clock size={14} />{article.readTime}</span>
          <span>{article.date}</span>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full group-hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30">
          Read Article
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  </PostLink>
);

const ArticleCard = ({ article, baked }) => (
  <PostLink article={article} baked={baked}
    className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-red-600 hover:-translate-y-1 transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <Badge category={article.category} />
      <ArrowUpRight size={18} className="text-gray-300 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </div>
    <h3 className="text-lg font-black text-gray-900 leading-snug mb-3 group-hover:text-red-600 transition-colors flex-1">{article.title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{article.excerpt}</p>
    <div className="flex items-center gap-3 text-gray-400 text-xs pt-4 border-t border-gray-100">
      <span className="flex items-center gap-1"><Clock size={12} />{article.readTime}</span>
      <span className="w-1 h-1 bg-gray-300 rounded-full" />
      <span>{article.date}</span>
    </div>
  </PostLink>
);

const EmptyState = ({ query }) => (
  <div className="col-span-full flex flex-col items-center py-24 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
      <Search size={32} className="text-gray-300" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">No articles found</h3>
    <p className="text-gray-500">
      {query ? `No results for "${query}". Try a different search.` : 'No articles in this category yet. Check back soon!'}
    </p>
  </div>
);

const Blog = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Start from the list in this file; replace it with the saved full list (newest first) once it loads.
  const [articles, setArticles] = useState(BLOG_ARTICLES.map(toCard));
  const [baked, setBaked] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch('/blog-data/index.json', { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d || !Array.isArray(d.entries) || !d.entries.length) return;
        setBaked(!!d.baked);
        setArticles(d.entries.map((e, i) => ({ id: i + 1, ...e })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const CATEGORIES = BLOG_CATEGORIES;

  const featured = articles.find(a => a.featured);
  const rest = articles.filter(a => !a.featured);

  const filtered = rest.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <Navbar />

      <div className="relative bg-gradient-to-b from-gray-800 to-black text-white pt-36 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gray-700/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-700 shadow-xl mb-8 backdrop-blur-md">
            <Rss size={14} className="text-red-500" />
            <span className="text-sm font-bold tracking-wide text-gray-300 uppercase">Updated Every Tuesday & Thursday</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6 text-white">
            AI Insights &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">Career Intelligence</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed font-medium mb-10">
            Practical guides, industry trends, and skill breakdowns — written for professionals who want to stay ahead of the AI curve.
          </p>
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-white/10 border border-gray-700 rounded-full text-white placeholder-gray-500 font-medium backdrop-blur-md focus:outline-none focus:border-red-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-8 text-sm text-gray-400">
            {[
              { label: 'Articles Published', value: articles.length },
              { label: 'Topics Covered',     value: CATEGORIES.length - 1 },
              { label: 'Avg. Read Time',     value: '6 mins' },
              { label: 'New Article',        value: 'Every Tuesday' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="font-black text-white text-base">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {featured && !searchQuery && activeCategory === 'All' && (
          <div className="mb-16"><FeaturedCard article={featured} baked={baked} /></div>
        )}

        <div className="flex flex-wrap gap-3 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length > 0
            ? filtered.map(article => <ArticleCard key={article.slug} article={article} baked={baked} />)
            : (searchQuery || activeCategory !== 'All') && <EmptyState query={searchQuery} />
          }
        </div>

        {articles.length < 6 && (
          <div className="mt-16 text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Rss size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">More articles every week</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              New articles drop every Tuesday and Thursday at 6:30 PM IST — covering AI trends, career tips, and practical how-to guides.
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-red-900 via-red-950 to-black text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Go Deeper?</h2>
          <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Reading about AI is a start. Earning a certificate proves it. Explore our courses and get ahead today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/courses')} className="px-10 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-900/40 border border-red-500">
              Explore Courses
            </button>
            <button onClick={() => navigate('/pricing')} className="px-10 py-4 bg-transparent text-white font-bold rounded-full border border-gray-600 hover:bg-white hover:text-black transition-all">
              View Pricing
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;