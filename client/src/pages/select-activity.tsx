import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

const ACTIVITY_CATEGORIES = [
  { id: 'ALL', label: 'ALL', active: true },
  { id: 'STRAIN', label: 'STRAIN', active: false },
  { id: 'RECOVERY', label: 'RECOVERY', active: false },
  { id: 'SLEEP', label: 'SLEEP', active: false },
];

const ALL_ACTIVITIES = [
  { id: 'walking', label: 'WALKING', icon: 'fa-walking', category: 'STRAIN' },
  { id: 'running', label: 'RUNNING', icon: 'fa-running', category: 'STRAIN' },
  { id: 'cycling', label: 'CYCLING', icon: 'fa-biking', category: 'STRAIN' },
];

export default function SelectActivity() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filteredActivities = ALL_ACTIVITIES.filter(activity => {
    const matchesSearch = activity.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || activity.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleActivitySelect = (activityId: string) => {
    // Navigate back to add activity page with selected activity
    setLocation(`/add-activity?activity=${activityId}`);
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-center p-4 mb-6 relative">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/add-activity')}
          className="absolute left-4 p-2 text-white hover:bg-white/20"
        >
          <i className="fas fa-chevron-left text-xl"></i>
        </Button>
        <h1 className="text-xl font-bold text-white">SELECT ACTIVITY</h1>
      </div>

      <main className="px-4 max-w-lg mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <Input
              type="text"
              placeholder="Search for Activities"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto">
          {ACTIVITY_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'text-white border-b-2 border-white bg-transparent hover:bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Section Header */}
        <div className="mb-4">
          <h2 className="text-gray-400 text-sm font-medium tracking-wide">
            {activeCategory} A-Z
          </h2>
        </div>

        {/* Activity List */}
        <div className="space-y-3 mb-8">
          {filteredActivities.map((activity) => (
            <Card 
              key={activity.id} 
              className="cursor-pointer transition-all duration-200 border-0 bg-gray-800 hover:bg-gray-700"
              onClick={() => handleActivitySelect(activity.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className={`fas ${activity.icon} text-gray-400 text-lg`}></i>
                  </div>
                  <span className="text-white font-medium">{activity.label}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredActivities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No activities found matching your search</p>
          </div>
        )}
      </main>
    </div>
  );
}