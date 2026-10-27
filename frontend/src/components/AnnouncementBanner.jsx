import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Site-wide heads-up that upgraded course content is coming (NOT new
// additions to the catalog — the existing six courses are getting richer
// lessons and practice material). Dismissible, and stays dismissed
// per-browser via localStorage. Bump ANNOUNCEMENT_ID (e.g. to
// 'course-upgrade-2026-11') whenever you want it to resurface for everyone,
// since a new id means localStorage has no record of a dismissal.
const ANNOUNCEMENT_ID = 'course-upgrade-2026-10';
const STORAGE_KEY = 'dismissed_announcement';

const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== ANNOUNCEMENT_ID) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_ID);
    setVisible(false);
  };

  if (!visible) return null;

  // Fixed and positioned just below the site's fixed top navbar (h-20 / 80px),
  // the same way CookieConsent overlays the bottom of the viewport instead of
  // pushing page layout. z-40 keeps it under the navbar's z-50 so nav dropdowns
  // still sit on top of it.
  // Reuses the hero section's own "live" pill motif (animate-ping red dot)
  // instead of a generic icon, so the strip reads as part of the existing
  // design system rather than a bolted-on notice.
  return (
    <div className="fixed top-20 left-0 w-full z-40 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-red-900/40 text-white px-4 py-2.5 shadow-lg">
      <div className="container mx-auto max-w-6xl flex items-center justify-center gap-2.5 text-center pr-8">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
        </span>
        <p className="text-xs md:text-sm font-medium text-gray-200">
          We're upgrading our courses — richer lessons and more hands-on practice are on the way.{' '}
          <span className="text-white font-bold">Stay tuned.</span>
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AnnouncementBanner;