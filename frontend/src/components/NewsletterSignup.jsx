import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import API_BASE_URL from '../config';

// Weekly-digest signup (double opt-in: they get a confirmation email first).
// `website` is a honeypot - hidden from people, filled in by bots; the server ignores those.
const NewsletterSignup = ({ source = 'home' }) => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending'); setMessage('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/newsletter/subscribe`, { email: email.trim(), website, source });
      setMessage(res.data.msg);
      setState('done');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Something went wrong. Please try again.');
      setState('error');
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-red-950 text-white" id="newsletter">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 bg-red-600/15 border border-red-600/30 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5">
          <Sparkles size={14} /> The Weekly Digest
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-3">One useful AI prompt, every week.</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          A ready-to-use prompt for your job, one practical tip and what's new on AICourseHubPro. Short, free, and you can unsubscribe in one click.
        </p>

        {state === 'done' ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 max-w-lg mx-auto flex items-start gap-3 text-left" role="status">
            <CheckCircle className="text-green-400 shrink-0 mt-0.5" size={22} />
            <p className="text-green-100">{message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="max-w-lg mx-auto" noValidate>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" aria-label="Email address"
                  className="w-full bg-black/60 border border-gray-700 focus:border-red-600 outline-none rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500"
                />
              </div>
              <button type="submit" disabled={state === 'sending'}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-7 py-3.5 rounded-xl transition flex items-center justify-center gap-2">
                {state === 'sending' ? <><Loader2 className="animate-spin" size={18} /> Subscribing…</> : 'Subscribe'}
              </button>
            </div>
            {/* honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
            {state === 'error' && <p className="text-red-400 text-sm mt-3" role="alert">{message}</p>}
            <p className="text-gray-500 text-xs mt-4">No spam, ever. We'll email you a link to confirm your address first.</p>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterSignup;
