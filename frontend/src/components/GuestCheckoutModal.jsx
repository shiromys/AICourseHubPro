import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Shown to visitors who are not logged in, right before Stripe. We need their email
// FIRST so the server can check whether that email already owns the course (and
// refuse the payment if so). The same email is then locked into Stripe's page.
//
// Props:
//   open, onClose
//   onSubmit(email) -> resolves { ok: true } or { ok: false, message, alreadyOwned }
//   busy: boolean
const GuestCheckoutModal = ({ open, courseTitle, onClose, onSubmit, busy }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [ownedMessage, setOwnedMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setOwnedMessage('');
    try { setEmail(localStorage.getItem('checkout_email') || ''); } catch { /* storage unavailable */ }
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOwnedMessage('');
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError('Please enter a valid email address.');
      return;
    }
    try { localStorage.setItem('checkout_email', clean); } catch { /* ignore */ }
    const result = await onSubmit(clean);
    if (result && !result.ok) {
      if (result.alreadyOwned) setOwnedMessage(result.message);
      else setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-7 shadow-2xl text-white">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-gray-500 hover:text-white transition">
          <X size={18} />
        </button>

        <div className="h-11 w-11 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center mb-4">
          <Mail className="text-red-500" size={20} />
        </div>
        <h2 className="text-xl font-black mb-1">Where should we send your course?</h2>
        {courseTitle && <p className="text-sm text-gray-400 mb-4">{courseTitle}</p>}

        {ownedMessage ? (
          <div>
            <div className="rounded-xl border border-yellow-600/40 bg-yellow-500/10 p-4 text-sm text-yellow-200 mb-4">
              {ownedMessage}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/login')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">
                Log in
              </button>
              <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-sm text-gray-400 mb-4">
              Enter your email and you'll go straight to secure payment. Your course is linked to this email, so use one you can access.
            </p>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-black border border-gray-700 focus:border-red-600 outline-none rounded-xl px-4 py-3 text-white placeholder-gray-600 mb-3"
            />
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {busy ? <><Loader2 className="animate-spin" size={18} /> Checking…</> : 'Continue to payment'}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mt-3">
              <ShieldCheck size={14} /> Payments are processed securely by Stripe.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-red-400 hover:underline">Log in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default GuestCheckoutModal;
