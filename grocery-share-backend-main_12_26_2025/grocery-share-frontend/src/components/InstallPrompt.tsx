import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
          <img src="/pwa-192x192.png" alt="BaskMate" className="w-10 h-10" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Install BaskMate</p>
          <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for the best experience</p>
        </div>
        <button onClick={handleDismiss} className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-medium"
        >
          Install
        </button>
      </div>
    </div>
  );
};
