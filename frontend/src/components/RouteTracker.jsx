import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Fires a GA4 page_view and a Meta Pixel PageView on every client-side
// route change. This app is a single-page app, so React Router swaps
// pages without a real browser reload — GTM/GA4/Meta Pixel in index.html
// only fire once, on the very first load. Without this, only the first
// page a visitor lands on is ever tracked.
const RouteTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first mount: GA4 and Meta Pixel already log this initial
    // pageview themselves via the base scripts in index.html. Firing here
    // too would double-count the landing page.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const path = location.pathname + location.search;

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null;
};

export default RouteTracker;