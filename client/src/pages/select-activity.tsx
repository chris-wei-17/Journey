import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ACTIVITY_CATEGORIES = [
  { id: 'ALL', label: 'ALL', active: true },
  { id: 'STRAIN', label: 'STRAIN', active: false },
  { id: 'RECOVERY', label: 'RECOVERY', active: false },
  { id: 'SLEEP', label: 'SLEEP', active: false },
];

const DEFAULT_ACTIVITIES = [
  { id: 'walking', label: 'WALKING', icon: 'fa-walking', category: 'STRAIN' },
  { id: 'running', label: 'RUNNING', icon: 'fa-running', category: 'STRAIN' },
  { id: 'cycling', label: 'CYCLING', icon: 'fa-biking', category: 'STRAIN' },
];

// Cache key for localStorage
const CUSTOM_ACTIVITIES_CACHE_KEY = 'journey_custom_activities';
const CACHE_EXPIRY_HOURS = 24;

interface CachedCustomActivities {
  data: any[];
  timestamp: number;
}

interface CustomActivity {
  id: number;
  name: string;
  category: string;
  icon: string;
  userId: number;
  createdAt: string;
}

export default function SelectActivity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');

  // Fetch custom activities with caching
  const { data: customActivities = [], isLoading } = useQuery({
    queryKey: ['/api/custom-activities'],
    queryFn: async () => {
      // Check cache first
      const cached = getCachedCustomActivities();
      if (cached) {
        return cached;
      }

      // Fetch from API
      const activities = await apiRequest('/api/custom-activities', 'GET');
      setCachedCustomActivities(activities);
      return activities;
    },
  });

  // Create custom activity mutation
  const createCustomActivityMutation = useMutation({
    mutationFn: async (activityData: { name: string; category: string; icon: string }) => {
      return await apiRequest('/api/custom-activities', 'POST', activityData);
    },
    onSuccess: (newActivity) => {
      // Update cache
      const updatedActivities = [...customActivities, newActivity];
      setCachedCustomActivities(updatedActivities);
      
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/custom-activities'] });
      
      toast({
        title: "Success",
        description: `"${newActivity.name}" added to your activities!`,
      });
      
      // Clear input and hide form
      setNewActivityName('');
      setShowAddInput(false);
      
      // Navigate to add activity with the new activity
      setLocation(`/add-activity?activity=${newActivity.name.toLowerCase().replace(/\s+/g, '-')}`);
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast({
          title: "Activity exists",
          description: "This activity is already in your list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add custom activity. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Cache management functions
  const getCachedCustomActivities = (): CustomActivity[] | null => {
    try {
      const cached = localStorage.getItem(CUSTOM_ACTIVITIES_CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedCustomActivities = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;
      const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      if (cacheAge > maxAge) {
        localStorage.removeItem(CUSTOM_ACTIVITIES_CACHE_KEY);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.error('Error reading cached custom activities:', error);
      localStorage.removeItem(CUSTOM_ACTIVITIES_CACHE_KEY);
      return null;
    }
  };

  const setCachedCustomActivities = (activities: CustomActivity[]) => {
    try {
      const cacheData: CachedCustomActivities = {
        data: activities,
        timestamp: Date.now(),
      };
      localStorage.setItem(CUSTOM_ACTIVITIES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching custom activities:', error);
    }
  };

  // Convert custom activities to the same format as default activities
  const formattedCustomActivities = customActivities.map((activity: CustomActivity) => ({
    id: `custom-${activity.id}`,
    label: activity.name.toUpperCase(),
    icon: activity.icon,
    category: activity.category,
    isCustom: true,
  }));

  // Combine default and custom activities
  const allActivities = [...DEFAULT_ACTIVITIES, ...formattedCustomActivities];

  // Filter activities based on search and category
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || activity.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Check if search term matches any existing activity
  const searchMatchesExisting = allActivities.some(activity => 
    activity.label.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  // Show "Add Custom Activity" option when:
  // 1. There's a search term
  // 2. No existing activities match the search term
  // 3. Search term is not empty after trimming
  const shouldShowAddOption = searchTerm.trim() && !searchMatchesExisting && !showAddInput;

  const handleActivitySelect = (activityId: string) => {
    // Navigate back to add activity page with selected activity
    setLocation(`/add-activity?activity=${activityId}`);
  };

  const handleAddCustomActivity = () => {
    if (!newActivityName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an activity name.",
        variant: "destructive",
      });
      return;
    }

    // Determine category based on activeCategory (default to STRAIN if ALL is selected)
    const category = activeCategory === 'ALL' ? 'STRAIN' : activeCategory;

    createCustomActivityMutation.mutate({
      name: newActivityName.trim(),
      category,
      icon: 'fa-dumbbell', // Default icon for custom activities
    });
  };

  const handleQuickAdd = () => {
    const category = activeCategory === 'ALL' ? 'STRAIN' : activeCategory;
    
    createCustomActivityMutation.mutate({
      name: searchTerm.trim(),
      category,
      icon: 'fa-dumbbell',
    });
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
              placeholder="Search or add new activity"
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

        {/* Add Custom Activity Option - Quick Add */}
        {shouldShowAddOption && (
          <Card 
            className="mb-3 cursor-pointer transition-all duration-200 border-0 bg-green-800 hover:bg-green-700"
            onClick={handleQuickAdd}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="fas fa-plus text-green-200 text-lg"></i>
                </div>
                <span className="text-white font-medium">
                  Add "{searchTerm.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')}"
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Custom Activity Form */}
        {showAddInput && (
          <Card className="mb-6 bg-gray-800 border-0">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-plus text-gray-400 text-lg"></i>
                  </div>
                  <span className="text-white font-medium">Add New Activity</span>
                </div>
                <Input
                  type="text"
                  placeholder="Enter activity name"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomActivity()}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddCustomActivity}
                    disabled={createCustomActivityMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {createCustomActivityMutation.isPending ? 'Adding...' : 'Add Activity'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddInput(false);
                      setNewActivityName('');
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  {activity.isCustom && (
                    <span className="ml-auto text-xs text-gray-400">Custom</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredActivities.length === 0 && !shouldShowAddOption && !showAddInput && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No activities found matching your search</p>
            <Button
              onClick={() => setShowAddInput(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Custom Activity
            </Button>
          </div>
        )}

        {/* Add Activity Button */}
        {!showAddInput && searchTerm === '' && (
          <div className="text-center py-4">
            <Button
              onClick={() => setShowAddInput(true)}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Custom Activity
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading activities...</p>
          </div>
        )}
      </main>
    </div>
  );
}