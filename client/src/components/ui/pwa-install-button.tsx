import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { usePWAInstall } from "./pwa-install-prompt";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PWAInstallButton({ 
  variant = "default", 
  size = "md", 
  className = "" 
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const { canInstall, isInstalled } = usePWAInstall();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

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
      setDeferredPrompt(null);
    }
  };

  // Don't show if already installed or can't install
  if (isInstalled) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        disabled 
        className={className}
      >
        <Check className="w-4 h-4 mr-2" />
        App Installed
      </Button>
    );
  }

  if (!canInstall || !deferredPrompt) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstall}
      disabled={isInstalling}
      variant={variant}
      size={size}
      className={className}
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Installing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  );
}