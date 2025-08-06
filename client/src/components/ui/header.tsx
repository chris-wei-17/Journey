import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showHomeButton?: boolean;
}

// Enhanced PWA mode detection
function isPWAMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: window-controls-overlay)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         (window.navigator as any).standalone === true ||
         window.location.search.includes('pwa=true');
}

export function Header({ title, showBackButton = false, onBack, showHomeButton = false }: HeaderProps = {}) {
  const { user } = useAuth();
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const pwaMode = isPWAMode();
      setIsPWA(pwaMode);
      
      // Add debug logging
      console.log('🔍 PWA Detection Results:', {
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        windowControls: window.matchMedia('(display-mode: window-controls-overlay)').matches,
        minimalUI: window.matchMedia('(display-mode: minimal-ui)').matches,
        navigatorStandalone: (window.navigator as any).standalone,
        isPWAMode: pwaMode
      });
      
      // Force add body class for PWA mode
      if (pwaMode) {
        document.body.classList.add('pwa-mode');
        console.log('✅ Added pwa-mode class to body');
      }
    };
    
    // Check immediately and on media query changes
    checkPWA();
    
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const minimalUIQuery = window.matchMedia('(display-mode: minimal-ui)');
    
    standaloneQuery.addListener(checkPWA);
    minimalUIQuery.addListener(checkPWA);
    
    return () => {
      standaloneQuery.removeListener(checkPWA);
      minimalUIQuery.removeListener(checkPWA);
    };
  }, []);

  // Aggressive inline styles for PWA mode
  const pwaHeaderStyles = isPWA ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    WebkitTransform: 'translateZ(0)',
    WebkitBackfaceVisibility: 'hidden' as const,
  } : {};

  return (
    <header 
      className={`bg-white shadow-lg border-0 px-4 fixed top-0 left-0 right-0 z-50 
        pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 min-h-[calc(env(safe-area-inset-top)+4rem)]
        ${isPWA ? 'pwa-header-pinned pwa-header-forced' : ''}`}
      style={pwaHeaderStyles}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Back button or Navigation Menu */}
        <div className="flex items-center space-x-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack || (() => window.history.back())}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50/50 p-2 flex items-center gap-2"
            >
              <i className="fas fa-arrow-left text-lg"></i>
              <span>Back</span>
            </Button>
          ) : (
            <NavigationMenu />
          )}
          <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-800">
            {title || "Journey"}
          </h1>
            <p className="text-sm text-gray-400">
               Your fitness journal for every step
            </p>
        </div>
        </div>
        
        {/* Right side - Home button and Avatar */}
        <div className="flex items-center space-x-3">
          {showHomeButton && (
            <Link href="/">
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                <i className="fas fa-home text-sm" style={{ color: '#FFFFFF' }}></i>
              </div>
            </Link>
          )}
          <Link href="/profile">
            <div className="w-8 h-8 flex items-center justify-center cursor-pointer">
              <Avatar
                firstName={user?.firstName || undefined}
                lastName={user?.lastName || undefined}
                profileImageUrl={user?.profileImageUrl || undefined}
                size="md"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}