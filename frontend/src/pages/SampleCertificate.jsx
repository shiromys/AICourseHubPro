import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CertificateCanvas from '../components/CertificateCanvas';
import { SAMPLE_CERT_TEXT as T } from '../seo/samples.js';
import { publishedSamples, sampleUrl } from '../content/samples.js';
import { track } from '../utils/analytics';
import { ArrowRight } from 'lucide-react';

const CERT_W = 1123;
const CERT_H = 794;

// A public, clearly marked SAMPLE certificate with the plain rules for earning and verifying a real one.
// Event: certificate_preview_view once when the page opens.
const SampleCertificate = () => {
  const wrap = useRef(null);
  const seen = useRef(false);
  const [scale, setScale] = useState(1);
  const samples = publishedSamples();

  useEffect(() => {
    if (!seen.current) { seen.current = true; track('certificate_preview_view', { item_id: 'sample-certificate' }); }
  }, []);
  // The certificate is a fixed-size drawing; shrink it to fit narrow screens.
  useLayoutEffect(() => {
    const fit = () => { if (wrap.current) setScale(Math.min(1, wrap.current.clientWidth / CERT_W)); };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const Steps = ({ items, ordered }) => {
    const Tag = ordered ? 'ol' : 'ul';
    return <Tag className={`${ordered ? 'list-decimal' : 'list-disc'} pl-6 space-y-2 text-gray-700`}>{items.map((x, i) => <li key={i}>{x}</li>)}</Tag>;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{T.h1}</h1>
          <p className="text-xl text-gray-700 leading-relaxed mb-8" data-testid="sample-cert-lead">{T.lead}</p>

          <div ref={wrap} className="w-full mb-10" data-testid="sample-cert">
            <div role="img" aria-label="A sample certificate of completion, marked SAMPLE. It has no real name and cannot be verified." style={{ height: CERT_H * scale }} className="shadow-2xl rounded-sm overflow-hidden border border-gray-200">
              <div style={{ width: CERT_W, height: CERT_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <CertificateCanvas sample name="Your Name Here" courseTitle="Course Title" score={70} certId="SAMPLE" />
              </div>
            </div>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-2xl font-black mb-3">{T.whatTitle}</h2>
            <p className="text-gray-700 leading-relaxed mb-8">{T.what}</p>
            <h2 className="text-2xl font-black mb-3">{T.earnTitle}</h2>
            <div className="mb-8"><Steps ordered items={T.earn} /></div>
            <h2 className="text-2xl font-black mb-3">{T.verifyTitle}</h2>
            <div className="mb-10"><Steps items={T.verify} /></div>
          </div>

          <aside className="rounded-2xl bg-black text-white p-8 max-w-3xl" data-testid="sample-cert-cta">
            <h2 className="text-2xl font-black mb-2">Ready to earn a real one?</h2>
            <p className="text-gray-300 mb-5">Each course is a one-time payment with lifetime access.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/courses" onClick={() => track('sample_cert_to_courses', { item_id: 'sample-certificate' })} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">See the courses <ArrowRight size={16} /></Link>
              {samples.length > 0 && <Link to={sampleUrl(samples[0].slug)} className="inline-flex items-center gap-2 px-6 py-3 border border-gray-500 text-white font-bold rounded-full hover:border-white">Try a free lesson</Link>}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SampleCertificate;
