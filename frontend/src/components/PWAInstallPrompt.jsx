import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user hasn't dismissed before
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96 animate-fade-in-up">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <img src="/icons/icon-72x72.png" alt="AICourseHubPro" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Install AICourseHubPro</p>
          <p className="text-gray-400 text-xs mt-0.5">Add to your home screen for quick access</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition"
          >
            <Download size={14} /> Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300 p-1 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}