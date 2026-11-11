import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ResourceSeo } from '../components/Seo';
import { AUDIENCES, publishedResources, resourceUrl } from '../content/resources.js';
import { RESOURCE_HUB_META } from '../seo/resources.js';
import { track } from '../utils/analytics';

// The hub: every published guide, grouped by audience. With no published pages it does not exist.
const Resources = () => {
  const pages = publishedResources();
  useEffect(() => { if (pages.length) track('resource_hub_view'); }, [pages.length]);
  if (!pages.length) return <Navigate to="/" replace />;
  const groups = AUDIENCES.map((aud) => ({ aud, items: pages.filter((p) => p.audience === aud.id) })).filter((g) => g.items.length);
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <ResourceSeo hub />
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">Free AI Templates and Guides for Work</h1>
          <p className="text-lg text-gray-600 max-w-3xl mb-12">{RESOURCE_HUB_META.description}</p>
          {groups.map(({ aud, items }) => (
            <section key={aud.id} className="mb-12" aria-labelledby={`aud-${aud.id}`}>
              <h2 id={`aud-${aud.id}`} className="text-2xl font-black mb-4">{aud.label}</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {items.map((p) => (
                  <li key={p.slug}>
                    <Link to={resourceUrl(p.slug)} className="block h-full rounded-2xl border border-gray-200 p-6 hover:border-red-500 hover:shadow-lg transition">
                      <h3 className="text-lg font-black mb-2">{p.content.title}</h3>
                      <p className="text-sm text-gray-600">{p.content.shortAnswer}</p>
                      <p className="mt-3 text-xs font-bold text-red-600 uppercase tracking-wide">Free template included</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="mt-6"><Link to="/courses" className="text-red-600 font-bold hover:underline">Browse all courses</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
