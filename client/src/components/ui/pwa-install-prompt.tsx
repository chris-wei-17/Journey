import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Monitor, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(event);
      
      // Show prompt after a short delay if not already installed
      if (!isStandalone) {
        setTimeout(() => {
          setIsVisible(true);
        }, 3000); // Show after 3 seconds
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA install accepted');
      } else {
        console.log('❌ PWA install dismissed');
      }
    } catch (error) {
      console.error('PWA install error:', error);
    } finally {
      setIsInstalling(false);
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already dismissed this session or if already installed
  if (!isVisible || !deferredPrompt || isStandalone) {
    return null;
  }

  // Don't show if user already dismissed it this session
  if (sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={handleDismiss}
      />
      
      {/* Prompt Card */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-top-4 duration-500">
        <Card className="w-full max-w-md bg-white shadow-2xl border-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Install Journey</h3>
                  <p className="text-white/90 text-sm">Get the full app experience</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Native Experience</div>
                  <div className="text-gray-500">No browser bars</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Offline Access</div>
                  <div className="text-gray-500">Works anywhere</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-rocket text-purple-600 text-sm"></i>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Faster Loading</div>
                  <div className="text-gray-500">Instant startup</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-home text-orange-600 text-sm"></i>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Home Screen</div>
                  <div className="text-gray-500">Easy access</div>
                </div>
              </div>
            </div>

            {/* Install Steps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">📱 <strong>Installation takes seconds:</strong></p>
              <ol className="text-sm text-gray-600 space-y-1 ml-4">
                <li>1. Click "Install App" below</li>
                <li>2. Confirm installation</li>
                <li>3. Find Journey on your home screen</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg"
                size="lg"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="px-6"
                size="lg"
              >
                Later
              </Button>
            </div>

            {/* Fine Print */}
            <p className="text-xs text-gray-500 text-center">
              Free • No app store required • Uninstall anytime
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

// Hook for checking PWA install availability
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsInstalled(standalone);
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (!isInstalled) {
        setCanInstall(true);
      }
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  return { canInstall, isInstalled };
}