import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ResourceDownload from '../components/ResourceDownload';
import { ResourceSeo } from '../components/Seo';
import { resourceBySlug, relatedResources, hasPublishedResources, resourceUrl } from '../content/resources.js';
import { longDate } from '../seo/resources.js';
import { COURSE_LABELS } from '../seo/blog.js';
import { track } from '../utils/analytics';
import API_BASE_URL from '../config';
import { ArrowRight } from 'lucide-react';

const Bullets = ({ items }) => <ul className="list-disc pl-6 space-y-1.5 text-gray-700">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
const H2 = ({ children }) => <h2 className="text-2xl font-black mt-10 mb-3">{children}</h2>;

// One library page, in the order the plan sets: short answer, who it is for, before you start,
// worked example, template, cautions, questions, course box, related pages, reviewer and date.
const ResourcePage = () => {
  const { slug } = useParams();
  const page = resourceBySlug(slug);
  const [courses, setCourses] = useState([]);
  useEffect(() => { if (page) track('resource_view', { resource: slug }); }, [slug]); // eslint-disable-line
  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE_URL}/api/courses`).then((r) => { if (!cancelled && Array.isArray(r.data)) setCourses(r.data.filter((c) => c && !c.legacy)); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!page) return <Navigate to={hasPublishedResources() ? '/resources' : '/'} replace />;
  const c = page.content;
  const course = courses.find((x) => x.slug === page.course);
  const related = relatedResources(page, 3);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <ResourceSeo page={page} />
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-red-600">Home</Link><span>›</span>
            <Link to="/resources" className="hover:text-red-600">Resources</Link><span>›</span>
            <span className="text-gray-400">{c.title}</span>
          </nav>
          <article>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">{c.title}</h1>
            <p className="text-xl text-gray-700 leading-relaxed mb-4" data-testid="short-answer">{c.shortAnswer}</p>
            <p className="text-sm text-gray-500 mb-8" data-testid="reviewer">Reviewed by {c.reviewer.name}, {c.reviewer.role} · Last updated <time dateTime={c.lastUpdated}>{longDate(c.lastUpdated)}</time></p>

            <H2>Who this is for</H2><Bullets items={c.whoFor} />
            <H2>What you need before you start</H2><Bullets items={c.beforeYouStart} />

            <H2>Worked example: {c.example.task}</H2>
            <h3 className="font-bold mt-4 mb-2">The input</h3>
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm" data-testid="example-input">{c.example.input}</pre>
            <h3 className="font-bold mt-4 mb-2">The output</h3>
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm" data-testid="example-output">{c.example.output}</pre>
            <h3 className="font-bold mt-4 mb-2">What to check or change by hand</h3>
            <Bullets items={c.example.check} />

            <div className="my-10"><ResourceDownload page={page} /></div>

            <H2>Cautions</H2><Bullets items={c.cautions} />

            <H2>Frequently asked questions</H2>
            <div className="space-y-5">{c.faq.map((f, i) => <div key={i}><h3 className="font-bold">{f.q}</h3><p className="text-gray-700 mt-1">{f.a}</p></div>)}</div>
          </article>

          <aside className="mt-12 rounded-2xl bg-black text-white p-8" data-testid="course-box">
            <p className="text-xs font-bold uppercase tracking-wide text-red-400 mb-2">Learn the full method</p>
            <h2 className="text-2xl font-black mb-2">{course ? course.title : COURSE_LABELS[page.course]}</h2>
            {course && <p className="text-gray-300 mb-5">{course.description}</p>}
            <Link to={`/courses/${page.course}`} onClick={() => track('resource_to_course', { resource: slug, course: page.course })} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">See the course <ArrowRight size={16} /></Link>
          </aside>

          {related.length > 0 && (
            <aside className="mt-10" data-testid="related-guides">
              <h2 className="text-xl font-black mb-3">Related guides</h2>
              <ul className="space-y-2">{related.map((r) => <li key={r.slug}><Link to={resourceUrl(r.slug)} className="text-red-600 font-bold hover:underline">{r.content.title}</Link></li>)}</ul>
            </aside>
          )}
          <p className="mt-10"><Link to="/resources" className="text-red-600 font-bold hover:underline">All guides</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResourcePage;
