import React, { useState } from 'react';
import axios from 'axios';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../config';
import { track } from '../utils/analytics';

// The free template: an email address unlocks the file. The weekly-digest box is optional and unticked;
// ticking it only starts the usual "confirm your subscription" email.
const ResourceDownload = ({ page }) => {
  const t = page.content.template;
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [website, setWebsite] = useState(''); // hidden trap for bots
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { url, pending }

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/resources/download`, { email: email.trim(), slug: page.slug, file: t.file, newsletter, website });
      const url = `${API_BASE_URL}${res.data.url}`;
      track('resource_download', { resource: page.slug, file_name: t.file, format: t.format, newsletter_opt_in: newsletter ? 1 : 0 });
      setDone({ url, pending: !!res.data.newsletter_pending });
      window.location.assign(url); // the file arrives as a download; the page stays where it is
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.msg) || 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <section className="rounded-2xl border border-red-100 bg-red-50 p-6 md:p-8" data-testid="resource-download" aria-labelledby="dl-h">
      <h2 id="dl-h" className="text-2xl font-black mb-1">Free template: {t.label}</h2>
      <p className="text-gray-600 mb-5">Format: {t.format}. Enter your email address and the download starts.</p>
      {done ? (
        <div role="status" data-testid="download-done">
          <p className="flex items-center gap-2 font-bold text-green-700 mb-2"><CheckCircle size={18} /> Your download is starting.</p>
          <p className="text-sm text-gray-600">If nothing happens, <a href={done.url} className="text-red-600 underline">click here</a> (the link works for 15 minutes).</p>
          {done.pending && <p className="text-sm text-gray-600 mt-2">If this address is not already subscribed, a confirmation email is on its way. Click the link in it to start receiving the weekly digest.</p>}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="dl-email" className="block text-sm font-bold mb-1">Email address</label>
            <input id="dl-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-red-500" />
          </div>
          <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>
          <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-1 h-4 w-4 accent-red-600" />
            <span>Also send me the free weekly AI digest (one short email a week; you confirm by email and can unsubscribe at any time). Optional.</span>
          </label>
          {error && <p role="alert" className="text-sm text-red-700 font-medium">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download the template
          </button>
          <p className="text-xs text-gray-500">We keep your email with the download record. We use it for the weekly digest only if you tick the box. See the <a href="/privacy" className="underline">Privacy Policy</a>.</p>
        </form>
      )}
    </section>
  );
};

export default ResourceDownload;
