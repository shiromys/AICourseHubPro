import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SampleSeo } from '../components/Seo';
import { sampleFor, SAMPLE_CERTIFICATE_URL } from '../content/samples.js';
import { COURSE_LABELS } from '../seo/blog.js';
import { track } from '../utils/analytics';
import { ArrowRight, Check, Copy, Clock } from 'lucide-react';

// One free sample lesson. Open to everyone: no account, no payment, no email address.
// Events: sample_start when the page opens, sample_complete when the visitor presses "I've finished".
const SampleLesson = () => {
  const { id: slug } = useParams();
  const smp = sampleFor(slug);
  const started = useRef(false);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (smp && !started.current) { started.current = true; track('sample_start', { item_id: slug }); }
  }, [slug]); // eslint-disable-line

  if (!smp) return <Navigate to={COURSE_LABELS[slug] ? `/courses/${slug}` : '/courses'} replace />;
  const c = smp.content;
  const label = COURSE_LABELS[slug];
  const quiz = c.check || [];

  const copy = async () => {
    try { await navigator.clipboard.writeText(c.tryIt.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) { /* the text is selectable anyway */ }
  };
  const finish = () => {
    if (finished) return;
    setFinished(true);
    track('sample_complete', { item_id: slug });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <SampleSeo slug={slug} content={c} />
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap">
            <Link to="/courses" className="hover:text-red-600">Courses</Link><span>›</span>
            <Link to={`/courses/${slug}`} className="hover:text-red-600">{label}</Link><span>›</span>
            <span className="text-gray-400">Free sample lesson</span>
          </nav>
          <article>
            <p className="inline-block text-xs font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-4" data-testid="sample-badge">Free sample lesson</p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{c.title}</h1>
            <p className="flex items-center gap-2 text-sm text-gray-500 mb-5"><Clock size={16} /> About {c.minutes} minutes · from the {label} course · no payment or email needed</p>
            <p className="text-xl text-gray-700 leading-relaxed mb-6" data-testid="sample-intro">{c.intro}</p>

            {c.sections.map((z, i) => (
              <section key={i} className="mb-6">
                <h2 className="text-2xl font-black mt-8 mb-3">{z.heading}</h2>
                {z.body.map((t, j) => <p key={j} className="text-gray-700 leading-relaxed mb-3">{t}</p>)}
                {z.bullets && z.bullets.length > 0 && <ul className="list-disc pl-6 space-y-1.5 text-gray-700">{z.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </section>
            ))}

            <section className="mt-10 rounded-2xl border border-red-100 bg-red-50 p-6" data-testid="try-it">
              <h2 className="text-2xl font-black mb-2">Try it yourself</h2>
              <p className="text-gray-700 mb-4">{c.tryIt.instruction}</p>
              <pre className="whitespace-pre-wrap break-words rounded-xl bg-white border border-gray-200 p-4 text-sm mb-3" data-testid="try-it-prompt">{c.tryIt.prompt}</pre>
              <button type="button" onClick={copy} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold hover:border-red-500">
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy the prompt'}
              </button>
            </section>

            {quiz.length > 0 && (
              <section className="mt-10" data-testid="self-check">
                <h2 className="text-2xl font-black mb-1">Check what you learned</h2>
                <p className="text-sm text-gray-500 mb-4">Not graded and not saved. It is only for you.</p>
                <div className="space-y-6">
                  {quiz.map((q, qi) => (
                    <fieldset key={qi}>
                      <legend className="font-bold mb-2">{qi + 1}. {q.q}</legend>
                      <div className="space-y-2">
                        {q.options.map((o, oi) => {
                          const picked = answers[qi] === oi;
                          const right = checked && oi === q.answer;
                          const wrong = checked && picked && oi !== q.answer;
                          return (
                            <label key={oi} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${right ? 'border-green-500 bg-green-50' : wrong ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                              <input type="radio" name={`q${qi}`} checked={picked} onChange={() => { setAnswers({ ...answers, [qi]: oi }); setChecked(false); }} className="mt-1 accent-red-600" />
                              <span>{o}</span>
                            </label>
                          );
                        })}
                      </div>
                      {checked && <p className="text-sm text-gray-600 mt-2">{answers[qi] === q.answer ? 'Correct. ' : 'The answer is: ' + q.options[q.answer] + '. '}{q.why}</p>}
                    </fieldset>
                  ))}
                </div>
                <button type="button" disabled={Object.keys(answers).length < quiz.length} onClick={() => setChecked(true)} className="mt-5 px-5 py-2.5 bg-black text-white font-bold rounded-full disabled:opacity-40">Check my answers</button>
              </section>
            )}

            <section className="mt-12 rounded-2xl bg-black text-white p-8" data-testid="sample-finish">
              {!finished ? (
                <>
                  <h2 className="text-2xl font-black mb-2">Finished the lesson?</h2>
                  <p className="text-gray-300 mb-5">Tell us you are done and we will show what comes next.</p>
                  <button type="button" onClick={finish} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">I've finished this lesson <Check size={16} /></button>
                </>
              ) : (
                <div role="status">
                  <h2 className="text-2xl font-black mb-2">Nice work, that is one lesson done.</h2>
                  <p className="text-gray-300 mb-5">The full {label} course has more lessons like this one, a final assessment, and a certificate of completion when you pass with at least 70%.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/courses/${slug}`} onClick={() => track('sample_to_course', { item_id: slug })} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">See the full course <ArrowRight size={16} /></Link>
                    <Link to={SAMPLE_CERTIFICATE_URL} className="inline-flex items-center gap-2 px-6 py-3 border border-gray-500 text-white font-bold rounded-full hover:border-white">See a sample certificate</Link>
                  </div>
                </div>
              )}
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SampleLesson;
