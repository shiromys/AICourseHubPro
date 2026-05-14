import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowUpRight, Clock, Tag, Search, Rss, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../config';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const primaryTag = (tags) => tags && tags.length > 0 ? tags[0].name : 'AI';

const categoryColors = {
  'AI':       'bg-blue-100 text-blue-700',
  'HR':       'bg-red-100 text-red-700',
  'Career':   'bg-green-100 text-green-700',
  'How-To':   'bg-purple-100 text-purple-700',
  'Industry': 'bg-yellow-100 text-yellow-700',
};

const tagColor = (tag) => {
  const key = Object.keys(categoryColors).find(k =>
    tag.toLowerCase().includes(k.toLowerCase())
  );
  return categoryColors[key] || 'bg-gray-100 text-gray-600';
};

const Badge = ({ tag }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${tagColor(tag)}`}>
    <Tag size={10} />
    {tag}
  </span>
);

const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
    <div className="h-5 bg-gray-200 rounded w-full mb-2" />
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
    <div className="h-3 bg-gray-100 rounded w-5/6 mb-6" />
    <div className="h-3 bg-gray-100 rounded w-24" />
  </div>
);

const FeaturedSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 md:p-12 animate-pulse">
    <div className="h-6 bg-gray-700 rounded w-40 mb-6" />
    <div className="h-8 bg-gray-700 rounded w-3/4 mb-3" />
    <div className="h-8 bg-gray-700 rounded w-1/2 mb-6" />
    <div className="h-4 bg-gray-800 rounded w-full mb-2" />
    <div className="h-4 bg-gray-800 rounded w-5/6 mb-8" />
    <div className="flex justify-between">
      <div className="h-4 bg-gray-700 rounded w-32" />
      <div className="h-10 bg-gray-700 rounded-full w-36" />
    </div>
  </div>
);

const FeaturedCard = ({ post }) => (
  <a
    href={post.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl border border-gray-700 hover:border-red-600 transition-all duration-300 overflow-hidden"
  >
    {post.coverImage?.url && (
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
      </div>
    )}
    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
    <div className="relative z-10 p-8 md:p-12">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold uppercase tracking-wide">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Latest Article
        </span>
        <Badge tag={primaryTag(post.tags)} />
      </div>
      <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4 group-hover:text-red-400 transition-colors">
        {post.title}
      </h2>
      <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-2xl">{post.brief}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <span className="flex items-center gap-1"><Clock size={14} />{post.readTimeInMinutes} min read</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full group-hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30">
          Read Article
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  </a>
);

const ArticleCard = ({ post }) => (
  <a
    href={post.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-600 hover:-translate-y-1 transition-all duration-300"
  >
    {post.coverImage?.url && (
      <div className="h-44 overflow-hidden">
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    )}
    <div className="flex flex-col flex-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <Badge tag={primaryTag(post.tags)} />
        <ArrowUpRight size={18} className="text-gray-300 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <h3 className="text-lg font-black text-gray-900 leading-snug mb-3 group-hover:text-red-600 transition-colors flex-1">
        {post.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
        {post.brief?.length > 120 ? post.brief.substring(0, 120) + '...' : post.brief}
      </p>
      <div className="flex items-center gap-3 text-gray-400 text-xs pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1"><Clock size={12} />{post.readTimeInMinutes} min read</span>
        <span className="w-1 h-1 bg-gray-300 rounded-full" />
        <span>{formatDate(post.publishedAt)}</span>
      </div>
    </div>
  </a>
);

const ErrorState = () => (
  <div className="col-span-full flex flex-col items-center py-24 text-center">
    <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
      <AlertCircle size={32} className="text-red-400" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">Couldn't load articles</h3>
    <p className="text-gray-500 mb-6">There was a problem fetching articles. Please try again.</p>
    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition">
      Try Again
    </button>
  </div>
);

const EmptyState = ({ query }) => (
  <div className="col-span-full flex flex-col items-center py-24 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
      <Search size={32} className="text-gray-300" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">No articles found</h3>
    <p className="text-gray-500">
      {query ? `No results for "${query}". Try a different search.` : 'No articles published yet. Check back soon!'}
    </p>
  </div>
);

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`${API_BASE_URL}/api/blog/posts`);
        const json = await res.json();
        setPosts(json.posts || []);
      } catch (err) {
        console.error('Blog fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const featured = posts[0] || null;
  const rest     = posts.slice(1);

  const filtered = rest.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.brief?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <Helmet>
        <title>Blog — AI Insights & Career Tips | AICourseHubPro</title>
        <meta name="description" content="Practical AI tips, career insights, and industry guides for professionals in HR, business, and beyond. Updated every Tuesday and Thursday." />
        <link rel="canonical" href="https://www.aicoursehubpro.com/blog" />
      </Helmet>

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
              { label: 'Articles Published', value: loading ? '—' : posts.length },
              { label: 'New Article',        value: 'Every Tuesday' },
              { label: 'Target Audience',    value: 'US · Canada · EU' },
              { label: 'Avg. Read Time',     value: '5–8 mins' },
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
        {loading ? (
          <div className="mb-16"><FeaturedSkeleton /></div>
        ) : !error && featured && !searchQuery && (
          <div className="mb-16"><FeaturedCard post={featured} /></div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <ErrorState />
          ) : filtered.length > 0 ? (
            filtered.map((post, i) => <ArticleCard key={i} post={post} />)
          ) : (
            <EmptyState query={searchQuery} />
          )}
        </div>

        {!loading && !error && posts.length < 4 && (
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