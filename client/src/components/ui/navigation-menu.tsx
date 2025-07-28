import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navigationItems = [
  { label: "Dashboard", path: "/", icon: "fas fa-home" },
  { label: "Progress", path: "/progress", icon: "fas fa-chart-line" },
  { label: "Goals", path: "/goals", icon: "fas fa-target" },
  { label: "Photos", path: "/photos", icon: "fas fa-camera" },
  { label: "Workouts", path: "/workouts", icon: "fas fa-dumbbell" },
  { label: "Nutrition", path: "/nutrition", icon: "fas fa-apple-alt" },
  { label: "Sleep", path: "/sleep", icon: "fas fa-calculator" },
  { label: "Feedback", path: "/feedback", icon: "fas fa-comment" },
];

export function NavigationMenu() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      
      // Prevent layout shifts when dropdown opens/closes
      if (open) {
        // Lock the current scroll position
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.classList.add('dropdown-open');
      } else {
        // Restore scroll position
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('dropdown-open');
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };

    // We'll pass this to the DropdownMenu's onOpenChange
    return () => {
      // Cleanup: ensure body styles are reset
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('dropdown-open');
    };
  }, []);

  return (
    <DropdownMenu onOpenChange={(open) => {
      setIsOpen(open);
      
      // Simple approach: just prevent body overflow changes
      if (open) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'relative';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
          <div className="flex flex-col space-y-1">
            <div className="w-4 h-0.5 bg-gray-600"></div>
            <div className="w-4 h-0.5 bg-gray-600"></div>
            <div className="w-4 h-0.5 bg-gray-600"></div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56"
        sideOffset={8}
        avoidCollisions={false}
        collisionPadding={0}
        sticky="partial"
        side="bottom"
        alignOffset={0}
      >
        {navigationItems.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link href={item.path} className={`flex items-center space-x-3 px-3 py-2 text-sm cursor-pointer ${
              location === item.path ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className={`${item.icon} w-4 h-4`}></i>
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}