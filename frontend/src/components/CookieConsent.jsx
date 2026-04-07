import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('user_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      loadTrackingScripts();
    }
  }, []);

  const loadTrackingScripts = () => {
    // 1. Load Meta Pixel
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', '1423175156007384');
    window.fbq('track', 'PageView');

    // 2. Load Google Analytics (Replace G-XXXXXXXXXX with your ID)
    const gaScript = document.createElement('script');
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-K56PJHNGKM";
    gaScript.async = true;
    document.head.appendChild(gaScript);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-K56PJHNGKM');
  };

  const handleAccept = () => {
    localStorage.setItem('user_cookie_consent', 'accepted');
    setShowBanner(false);
    loadTrackingScripts();
  };

  const handleReject = () => {
    localStorage.setItem('user_cookie_consent', 'rejected');
    setShowBanner(false);
    // Scripts remain blocked
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 p-6 z-50 text-white shadow-2xl">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <p className="font-bold text-white mb-1">GDPR & Privacy Compliance</p>
          We use strictly necessary cookies to make our site work (256-bit SSL secured). We also use optional analytics (Google) and marketing (Meta) cookies to improve your experience. We do not sell your data.
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={handleReject} className="px-5 py-2 text-sm font-bold border border-gray-500 rounded-lg hover:bg-gray-800 transition">
            Reject Optional
          </button>
          <button onClick={handleAccept} className="px-5 py-2 text-sm font-bold bg-red-600 rounded-lg hover:bg-red-700 transition">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;