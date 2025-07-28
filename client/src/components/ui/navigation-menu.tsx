import { useState } from "react";
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

  return (
    <DropdownMenu>
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
        avoidCollisions={true}
        sticky="always"
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