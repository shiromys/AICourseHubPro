import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BlogSeo } from '../components/Seo';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';
import { articleBySlug } from '../content/blogPosts.js';
import { relatedCourseSlug, COURSE_LABELS, cleanPostHtml } from '../seo/blog.js';
import { track } from '../utils/analytics';
import API_BASE_URL from '../config';
import axios from 'axios';

// One article, at /blog/<slug>. The text is a small file saved on this site at build time
// (/blog-data/<slug>.json), so the page never depends on Hashnode being reachable.
const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setState('loading'); setPost(null);
    fetch(`/blog-data/${encodeURIComponent(slug)}.json`, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : Promise.reject(new Error('missing'))))
      .then((p) => { if (!cancelled) { setPost(p); setState('ready'); } })
      .catch(() => { if (!cancelled) setState('missing'); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE_URL}/api/courses`).then((r) => { if (!cancelled && Array.isArray(r.data)) setCourses(r.data.filter((c) => c && !c.legacy)); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const entry = useMemo(() => {
    if (!post) return null;
    const known = articleBySlug(slug);
    return { slug, title: post.title, excerpt: known ? known.excerpt : post.brief, iso: post.iso || post.publishedAt, date: post.date || '', readTime: post.readTime || (known && known.readTime) || '', category: known ? known.category : '' };
  }, [post, slug]);

  const html = useMemo(() => (post ? cleanPostHtml(post.html) : ''), [post]);

  useEffect(() => { if (state === 'ready') track('blog_view', { post: slug }); }, [state, slug]);

  // links to other pages of this site inside the article move within the app instead of reloading
  const onBodyClick = (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('/') && !href.startsWith('//')) { e.preventDefault(); navigate(href); }
  };

  const related = entry ? relatedCourseSlug({ ...entry, tags: post.tags }) : null;
  const relatedCourse = related ? courses.find((c) => c.slug === related) : null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <BlogSeo entry={entry} post={post} missing={state === 'missing'} />
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8 flex items-center gap-2">
            <Link to="/" className="hover:text-red-600">Home</Link><span>›</span>
            <Link to="/blog" className="hover:text-red-600">Blog</Link>
            {entry && <><span>›</span><span className="text-gray-400 truncate">{entry.title}</span></>}
          </nav>

          {state === 'loading' && <div className="py-24 text-center text-gray-400" aria-busy="true">Loading article…</div>}

          {state === 'missing' && (
            <div className="py-24 text-center" data-testid="blog-missing">
              <h1 className="text-3xl font-black mb-4">We couldn't find that article</h1>
              <p className="text-gray-500 mb-8">It may have moved. Browse the latest articles instead.</p>
              <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700"><ArrowLeft size={16} /> All articles</Link>
            </div>
          )}

          {state === 'ready' && entry && (
            <article>
              {entry.category && <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-3">{entry.category}</p>}
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{entry.title}</h1>
              <p className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-8">
                {post.author && <span>By {post.author}</span>}
                <time dateTime={post.publishedAt || entry.iso || ''}>{entry.date}</time>
                {entry.readTime && <span className="flex items-center gap-1"><Clock size={14} />{entry.readTime}</span>}
              </p>
              {post.image && <img src={post.image} alt="" className="w-full rounded-2xl mb-8" />}
              <div className="prose prose-lg max-w-none prose-headings:font-black prose-a:text-red-600" onClick={onBodyClick} dangerouslySetInnerHTML={{ __html: html }} />

              <aside className="mt-14 rounded-2xl border border-red-100 bg-red-50 p-8" data-testid="blog-related">
                {related ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Related course</p>
                    <h2 className="text-2xl font-black mb-2">{relatedCourse ? relatedCourse.title : COURSE_LABELS[related]}</h2>
                    <p className="text-gray-600 mb-5">{relatedCourse ? relatedCourse.description : 'A practical, prompt-based course with a certificate of completion.'}</p>
                    <Link to={`/courses/${related}`} onClick={() => track('blog_to_course', { post: slug, course: related })} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">See the course <ArrowRight size={16} /></Link>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Go deeper</p>
                    <h2 className="text-2xl font-black mb-2">Put it into practice</h2>
                    <p className="text-gray-600 mb-5">Six self-paced AI courses for HR, nonprofits, government, analytics, automation and education. $29 each, lifetime access.</p>
                    <Link to="/courses" onClick={() => track('blog_to_course', { post: slug, course: 'catalog' })} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">Browse all courses <ArrowRight size={16} /></Link>
                  </>
                )}
              </aside>
              <p className="mt-10"><Link to="/blog" className="inline-flex items-center gap-2 text-red-600 font-bold hover:underline"><ArrowLeft size={16} /> All articles</Link></p>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
