import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SimpleDropdown } from "@/components/ui/simple-dropdown";

// Utility function to detect PWA mode
function isPWAMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: window-controls-overlay)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         (window.navigator as any).standalone === true;
}

const navigationItems = [
  { label: "Dashboard", path: "/", icon: "fas fa-home" },
  { label: "Blog", path: "/landing", icon: "fas fa-newspaper" },
  { label: "Goals", path: "/goals", icon: "fas fa-target" },
  { label: "Nutrition", path: "/nutrition", icon: "fas fa-apple-alt" },
  { label: "Workouts", path: "/workouts", icon: "fas fa-dumbbell" },
  { label: "Sleep", path: "/sleep", icon: "fas fa-calculator" },
  { label: "Photos", path: "/photos", icon: "fas fa-camera" },
  { label: "Journal", path: "/journal-history", icon: "fas fa-book-open" },
  { label: "Progress", path: "/progress", icon: "fas fa-chart-line" },
  { label: "Feedback", path: "/feedback", icon: "fas fa-comment" },
];

export function NavigationMenu() {
  const [location] = useLocation();
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      setIsPWA(isPWAMode());
    };
    
    checkPWA();
    
    // Listen for media query changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const minimalUIQuery = window.matchMedia('(display-mode: minimal-ui)');
    
    standaloneQuery.addListener(checkPWA);
    minimalUIQuery.addListener(checkPWA);
    
    return () => {
      standaloneQuery.removeListener(checkPWA);
      minimalUIQuery.removeListener(checkPWA);
    };
  }, []);

  const triggerButton = (
    <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
      <div className="flex flex-col space-y-1">
        <div className="w-4 h-0.5 bg-gray-600"></div>
        <div className="w-4 h-0.5 bg-gray-600"></div>
        <div className="w-4 h-0.5 bg-gray-600"></div>
      </div>
    </Button>
  );

  return (
    <SimpleDropdown trigger={triggerButton} className="w-56">
      <div className="py-1">
        {navigationItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`flex items-center space-x-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
              location === item.path ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
            }`}
          >
            <i className={`${item.icon} w-4 h-4`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
        
        {/* PWA-only diagnostic link */}
        {isPWA && (
          <>
            <div className="border-t border-gray-200 my-1"></div>
            <Link 
              href="/pwa-test" 
              className={`flex items-center space-x-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
                location === '/pwa-test' ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
              }`}
            >
              <i className="fas fa-cog w-4 h-4"></i>
              <span>🧪 PWA Test</span>
            </Link>
          </>
        )}
      </div>
    </SimpleDropdown>
  );
}