import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API_BASE_URL from '../config';
import { CheckCircle, Clock, BarChart, Shield, BookOpen, Lock, ChevronDown } from 'lucide-react';
import TextCoursePlayer from '../components/TextCoursePlayer';
import { CourseSeo } from '../components/Seo';
import { courseFaq } from '../seo/meta.js';
import useCheckout from '../hooks/useCheckout';
import { track, courseItem } from '../utils/analytics';
import { marketingFor } from '../content/courseMarketing';

const isNumeric = (p) => /^\d+$/.test(p || '');
const matches = (c, p) => (isNumeric(p) ? c.id === parseInt(p, 10) : c.slug === p);

// One public sales page per course, at /courses/<slug>. Enrolled learners opening the same
// address get the course player instead. Old numeric addresses (/courses/5) still work and
// forward to the readable one.
const CourseView = () => {
  const { id: param } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { startCheckout, buyingId, checkoutModal } = useCheckout();
  const processing = buyingId !== null;
  const viewedRef = useRef(null);

  useEffect(() => {
    // Already showing this course (e.g. we just switched /courses/5 to its readable address): no reload.
    if (course && matches(course, param)) return;
    loadCourse();
  }, [param]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/courses`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setCourses(list);
      // A readable address always means the course on sale, never a retired version with the same title.
      const found = isNumeric(param)
        ? list.find((c) => c.id === parseInt(param, 10))
        : (list.find((c) => c.slug === param && !c.legacy) || list.find((c) => c.slug === param));
      setCourse(found || null);

      let enrolled = false;
      if (found && token) {
        try {
          const r = await axios.get(`${API_BASE_URL}/api/enrollment/${found.id}`, { headers: { Authorization: `Bearer ${token}` } });
          enrolled = !!r.data;
        } catch (e) { enrolled = false; }
      }
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Failed to load course', error);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => startCheckout(course);

  // Old numeric address on the sales page: show the readable one.
  useEffect(() => {
    if (!loading && course && !isEnrolled && isNumeric(param) && course.slug && !course.legacy) {
      navigate(`/courses/${course.slug}`, { replace: true });
    }
  }, [loading, course?.id, isEnrolled, param]);

  // Analytics: a visitor is looking at a course's sales page (once per course, not for the player).
  useEffect(() => {
    if (!loading && course && !isEnrolled && viewedRef.current !== course.id) {
      viewedRef.current = course.id;
      const item = courseItem(course);
      track('view_item', { currency: 'USD', value: item.price, items: [item] });
    }
  }, [loading, course?.id, isEnrolled]);

  // The sales page has a sticky Enroll bar on phones; tell the page so the chat bubble sits above it.
  const showingSales = !loading && !!course && !isEnrolled;
  useEffect(() => {
    if (!showingSales) return undefined;
    document.body.classList.add('has-sticky-cta');
    return () => document.body.classList.remove('has-sticky-cta');
  }, [showingSales]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div></div>;
  if (!course) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p>Course not found.</p>
      <Link to="/courses" className="text-red-500 font-bold hover:underline">See all courses</Link>
    </div>
  );

  if (isEnrolled) {
    return (
      <>
        <CourseSeo course={null} />
        <TextCoursePlayer courseId={String(course.id)} courseData={course} />
      </>
    );
  }

  // ---------- Sales page ----------
  const mk = marketingFor(course.slug);
  const modules = course.modules || [];
  const lessonCount = modules.reduce((n, m) => n + (m.lessons ? m.lessons.length : 0), 0);
  const others = courses.filter((c) => c.id !== course.id && !c.legacy);
  const price = course.price;
  const ex = mk.workedExample && (mk.workedExample.task || mk.workedExample.result) ? mk.workedExample : null;

  const faq = courseFaq(course);

  const EnrollButton = ({ where }) => (
    <button
      onClick={handleBuy}
      disabled={processing}
      data-testid={`enroll-${where}`}
      className="px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg bg-red-600 hover:bg-red-700 text-white shadow-red-900/20 hover:scale-105 disabled:opacity-60"
    >
      {processing ? 'Processing...' : `Enroll Now - $${price}`}
    </button>
  );

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 pb-24 md:pb-0">
      <CourseSeo course={course} />

      <Navbar />

      {/* ---- Header: title, outcome, price, Enroll ---- */}
      <div className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-800 text-red-500 text-xs font-bold uppercase tracking-wider mb-6">
                <BookOpen size={14} />
                {course.category || 'Professional Course'}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">{course.title}</h1>
              {mk.outcome && <p className="text-xl text-white mb-4 leading-relaxed font-semibold">{mk.outcome}</p>}
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">{course.description}</p>
              <div className="flex flex-wrap gap-6 mb-8 text-sm font-medium text-gray-400">
                <div className="flex items-center gap-2"><Clock size={18} className="text-red-600" /><span>Self-Paced</span></div>
                <div className="flex items-center gap-2"><BarChart size={18} className="text-red-600" /><span>All Levels</span></div>
                <div className="flex items-center gap-2"><Shield size={18} className="text-red-600" /><span>Certificate Included</span></div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <EnrollButton where="top" />
                <span className="text-sm text-gray-500">One-time payment · Lifetime access</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6">What's inside</h2>
                <ul className="space-y-4">
                  {modules.map((m, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                      <span>{m.title}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-2"><Lock size={14} /> Secure Payment</span>
                    <span>{modules.length} modules · {lessonCount} lessons</span>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-3xl opacity-20 blur-xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 space-y-16 pb-20">

        {mk.whoFor && mk.whoFor.length > 0 && (
          <section data-testid="who-for">
            <h2 className="text-2xl font-bold text-white mb-4">Who it is for</h2>
            <ul className="space-y-3">
              {mk.whoFor.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300"><CheckCircle className="text-green-500 shrink-0 mt-1" size={18} /><span>{t}</span></li>
              ))}
            </ul>
          </section>
        )}

        {mk.produces && mk.produces.length > 0 && (
          <section data-testid="produces">
            <h2 className="text-2xl font-bold text-white mb-4">What you will produce</h2>
            <ul className="space-y-3">
              {mk.produces.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300"><CheckCircle className="text-green-500 shrink-0 mt-1" size={18} /><span>{t}</span></li>
              ))}
            </ul>
          </section>
        )}

        {ex && (
          <section data-testid="worked-example">
            <h2 className="text-2xl font-bold text-white mb-4">A worked example</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              {ex.task && <div><p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">The task</p><p className="text-gray-300">{ex.task}</p></div>}
              {ex.input && <div><p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">What you start with</p><p className="text-gray-300 whitespace-pre-line">{ex.input}</p></div>}
              {ex.result && <div><p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">What you get</p><p className="text-gray-200 whitespace-pre-line bg-black/40 border border-gray-800 rounded-xl p-4">{ex.result}</p></div>}
              {ex.check && <div><p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">What you check or change by hand before using it</p><p className="text-gray-300 whitespace-pre-line">{ex.check}</p></div>}
            </div>
          </section>
        )}

        <section data-testid="syllabus">
          <h2 className="text-2xl font-bold text-white mb-4">Syllabus</h2>
          <div className="space-y-3">
            {modules.map((m, i) => {
              const info = (mk.modules && mk.modules[i]) || {};
              const lessons = m.lessons || [];
              return (
                <details key={i} className="group bg-gray-900 border border-gray-800 rounded-xl">
                  <summary className="cursor-pointer list-none p-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{m.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {lessons.length} lesson{lessons.length === 1 ? '' : 's'}{info.minutes ? ` · about ${info.minutes} min` : ''}
                      </p>
                      {info.summary && <p className="text-gray-400 mt-2">{info.summary}</p>}
                    </div>
                    <ChevronDown className="shrink-0 text-gray-500 transition-transform group-open:rotate-180" size={20} />
                  </summary>
                  <ul className="px-5 pb-5 space-y-2 text-gray-400 text-sm">
                    {lessons.map((l, j) => <li key={j} className="flex gap-2"><span className="text-gray-600">•</span><span>{l.title}</span></li>)}
                  </ul>
                </details>
              );
            })}
          </div>
        </section>

        <section data-testid="certificate">
          <h2 className="text-2xl font-bold text-white mb-4">Your certificate</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-300 space-y-3">
            <p>Finish the lessons, then pass the final assessment with a score of <strong className="text-white">at least 70%</strong> to earn your certificate of completion.</p>
            <p>Every certificate has a unique ID. Anyone you share it with can check that it is real on our verification page.</p>
          </div>
        </section>

        <section data-testid="price-terms">
          <h2 className="text-2xl font-bold text-white mb-4">Price and terms</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-300 space-y-3">
            <p><strong className="text-white">${price}</strong>, paid once, with lifetime access. No subscription.</p>
            <p>Want more than one course? The <Link to="/pricing" className="text-red-400 hover:underline">Pro Bundle</Link> ($159) includes every course, and its price drops by $29 for each course you already own.</p>
            <p>All sales are final, except for technical or billing errors such as a duplicate charge. See the <Link to="/refund-policy" className="text-red-400 hover:underline">Refund Policy</Link> for the full wording.</p>
          </div>
        </section>

        <section data-testid="faq">
          <h2 className="text-2xl font-bold text-white mb-4">Questions</h2>
          <div className="space-y-3">
            {faq.map((f, i) => (
              <details key={i} className="group bg-gray-900 border border-gray-800 rounded-xl">
                <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4 font-bold text-white">
                  <span>{f.q}</span>
                  <ChevronDown className="shrink-0 text-gray-500 transition-transform group-open:rotate-180" size={20} />
                </summary>
                <p className="px-5 pb-5 text-gray-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section data-testid="related">
            <h2 className="text-2xl font-bold text-white mb-4">Other courses</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {others.map((c) => (
                <li key={c.id}>
                  <Link to={`/courses/${c.slug || c.id}`} className="block bg-gray-900 border border-gray-800 hover:border-red-700 rounded-xl p-4 text-gray-300 hover:text-white transition">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-2">{course.title}</h2>
          <p className="text-gray-400 mb-6">${price} · one-time payment · lifetime access · certificate of completion</p>
          <div className="flex justify-center"><EnrollButton where="bottom" /></div>
        </section>
      </div>

      {/* Phone: the Enroll button stays within reach while scrolling */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 border-t border-gray-800 p-3 flex items-center justify-between gap-3">
        <div className="text-sm"><p className="font-bold text-white">${price}</p><p className="text-gray-500">Lifetime access</p></div>
        <button onClick={handleBuy} disabled={processing} data-testid="enroll-sticky" className="px-6 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-60">
          {processing ? 'Processing...' : 'Enroll Now'}
        </button>
      </div>

      <Footer />
      {checkoutModal}
    </div>
  );
};

export default CourseView;
