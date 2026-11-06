// One place for everything that talks to Google Analytics / Ads from the app.
// Every call is safe: if the tag has not loaded (ad blocker, offline) nothing happens and
// nothing throws. Events are sent even when the visitor rejected optional cookies; Google's
// Consent Mode (set up in index.html) then keeps them cookie-less. Never put an email address
// or other personal detail in an event.

const CONSENT_KEY = 'user_cookie_consent';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const UTM_STORE = 'ach_utm';
const UTM_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // remember a campaign for 30 days

export const hasAnalyticsConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY) === 'accepted'; } catch (e) { return false; }
};

// Tell Google (and Meta) what the visitor chose. Called by the cookie banner.
export const applyConsent = (accepted) => {
  const state = accepted ? 'granted' : 'denied';
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: state, analytics_storage: state, ad_user_data: state, ad_personalization: state,
    });
  }
  if (typeof window.fbq === 'function') {
    window.fbq('consent', accepted ? 'grant' : 'revoke');
  }
};

export const track = (name, params = {}) => {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch (e) { /* tracking must never break the page */ }
};

// Fire an event at most once per key (e.g. one purchase per Stripe session, even if the page reloads).
export const trackOnce = (key, name, params = {}) => {
  const storeKey = `ach_sent_${key}`;
  try {
    if (localStorage.getItem(storeKey)) return false;
  } catch (e) { /* storage blocked: fall through and send once */ }
  track(name, params);
  try { localStorage.setItem(storeKey, '1'); } catch (e) { /* ignore */ }
  return true;
};

// Describe a course the way Google expects. Uses the readable address (slug) once courses have one.
export const courseItem = (course) => {
  if (!course) return {};
  const item = {
    item_id: String(course.slug || course.id),
    item_name: course.title || `Course ${course.id}`,
    quantity: 1,
  };
  if (course.price !== undefined && course.price !== null && !Number.isNaN(Number(course.price))) {
    item.price = Number(course.price);
  }
  return item;
};

const clean = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9_.\- ]/g, '').slice(0, 100).trim();

// Remember campaign tags from the address bar (?utm_source=...). Only for visitors who accepted
// analytics cookies; if they rejected, nothing is stored.
export const captureUtm = () => {
  if (!hasAnalyticsConsent()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    UTM_KEYS.forEach((k) => { const v = clean(params.get(k)); if (v) found[k] = v; });
    if (Object.keys(found).length) {
      localStorage.setItem(UTM_STORE, JSON.stringify({ ...found, ts: Date.now() }));
    }
  } catch (e) { /* ignore */ }
};

// The remembered campaign tags, ready to send to checkout. {} when none or no consent.
export const getUtm = () => {
  if (!hasAnalyticsConsent()) return {};
  try {
    const saved = JSON.parse(localStorage.getItem(UTM_STORE) || 'null');
    if (!saved || !saved.ts || Date.now() - saved.ts > UTM_MAX_AGE_MS) return {};
    const out = {};
    UTM_KEYS.forEach((k) => { if (saved[k]) out[k] = saved[k]; });
    return out;
  } catch (e) { return {}; }
};

// Remember which item the visitor was buying when they left for Stripe, so the purchase event
// on the confirmation page can name it properly (same tab, so sessionStorage is enough).
export const rememberCheckoutItem = (item) => {
  try { sessionStorage.setItem('ach_checkout_item', JSON.stringify(item)); } catch (e) { /* ignore */ }
};
export const recallCheckoutItem = (itemId) => {
  try {
    const it = JSON.parse(sessionStorage.getItem('ach_checkout_item') || 'null');
    return it && String(it.item_id) === String(itemId) ? it : null;
  } catch (e) { return null; }
};
