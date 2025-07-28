import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SimpleDropdown } from "@/components/ui/simple-dropdown";

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

const quickAccessItems = [
  { label: "Log Progress", path: "/progress", icon: "fas fa-plus", gradient: "from-pink-500 to-pink-600" },
  { label: "Add Photos", path: "/photos", icon: "fas fa-camera", gradient: "from-teal-400 to-teal-500" },
  { label: "View Goals", path: "/goals", icon: "fas fa-target", gradient: "from-yellow-400 to-orange-500" },
  { label: "Workouts", path: "/workouts", icon: "fas fa-dumbbell", gradient: "from-purple-500 to-purple-600" },
];

export function NavigationMenu() {
  const [location] = useLocation();

  // Don't show quick access on home page or feedback page
  const showQuickAccess = location !== "/" && location !== "/feedback";

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
    <SimpleDropdown trigger={triggerButton} className="w-72">
      <div className="py-1">
        {/* Navigation Items */}
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

        {/* Quick Access Section */}
        {showQuickAccess && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickAccessItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${item.gradient} text-white cursor-pointer hover:opacity-90 transition-opacity`}>
                      <div className="flex flex-col items-center space-y-1 text-center">
                        <i className={`${item.icon} text-sm`}></i>
                        <span className="text-xs font-medium leading-tight">{item.label}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </SimpleDropdown>
  );
}