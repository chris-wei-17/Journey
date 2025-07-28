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

const DEFAULT_RECENT_ACTIVITIES = [
  { id: 'walking', label: 'WALKING', icon: 'fa-walking', category: 'STRAIN' },
  { id: 'running', label: 'RUNNING', icon: 'fa-running', category: 'STRAIN' },
  { id: 'cycling', label: 'CYCLING', icon: 'fa-biking', category: 'STRAIN' },
  { id: 'sleep', label: 'SLEEP', icon: 'fa-bed', category: 'RECOVERY' },
];

const DEFAULT_PINNED_ACTIVITIES = [
  'sleep' // Sleep is pinned by default
];

// Cache keys for localStorage
const CUSTOM_ACTIVITIES_CACHE_KEY = 'journey_custom_activities';
const RECENT_ACTIVITIES_CACHE_KEY = 'journey_recent_activities';
const PINNED_ACTIVITIES_CACHE_KEY = 'journey_pinned_activities';
const CACHE_EXPIRY_HOURS = 24;
const MAX_PINNED_ACTIVITIES = 5;

interface CachedData {
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

interface Activity {
  id: string;
  label: string;
  icon: string;
  category: string;
  isCustom?: boolean;
}

export default function SelectActivity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [pinnedActivities, setPinnedActivities] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize pinned activities from cache
  useEffect(() => {
    const initialPinned = getPinnedActivities();
    setPinnedActivities(initialPinned);
  }, []);

  // Fetch custom activities with caching
  const { data: customActivities = [], isLoading } = useQuery({
    queryKey: ['/api/custom-activities'],
    queryFn: async () => {
      // Check cache first
      const cached = getCachedData(CUSTOM_ACTIVITIES_CACHE_KEY);
      if (cached) {
        return cached;
      }

      // Fetch from API
      const activities = await apiRequest('GET', '/api/custom-activities');
      setCachedData(CUSTOM_ACTIVITIES_CACHE_KEY, activities);
      return activities;
    },
  });

  // Create custom activity mutation
  const createCustomActivityMutation = useMutation({
    mutationFn: async (activityData: { name: string; category: string; icon: string }) => {
      return await apiRequest('POST', '/api/custom-activities', activityData);
    },
    onSuccess: (newActivity) => {
      // Update custom activities cache
      const updatedCustomActivities = [...customActivities, newActivity];
      setCachedData(CUSTOM_ACTIVITIES_CACHE_KEY, updatedCustomActivities);
      
      // Add to recent activities (at the beginning)
      const recentActivities = getCachedData(RECENT_ACTIVITIES_CACHE_KEY) || DEFAULT_RECENT_ACTIVITIES;
      const newRecentActivity = {
        id: `custom-${newActivity.id}`,
        label: newActivity.name.toUpperCase(),
        icon: newActivity.icon,
        category: newActivity.category,
        isCustom: true,
      };
      
      // Remove if already exists, then add to front, keep only 3
      const filteredRecent = recentActivities.filter((activity: Activity) => activity.id !== newRecentActivity.id);
      const updatedRecent = [newRecentActivity, ...filteredRecent].slice(0, 3);
      setCachedData(RECENT_ACTIVITIES_CACHE_KEY, updatedRecent);
      
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/custom-activities'] });
      
      toast({
        title: "Success",
        description: `"${newActivity.name.toUpperCase()}" added to your activities!`,
      });
      
      // Navigate to add activity with the new activity
      handleActivitySelect(newRecentActivity.id);
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
  const getCachedData = (key: string): any[] | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsedCache: CachedData = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;
      const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      if (cacheAge > maxAge) {
        localStorage.removeItem(key);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.error(`Error reading cached data for ${key}:`, error);
      localStorage.removeItem(key);
      return null;
    }
  };

  const setCachedData = (key: string, data: any[]) => {
    try {
      const cacheData: CachedData = {
        data: data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Error caching data for ${key}:`, error);
    }
  };

  // Get recent activities (cached or default)
  const getRecentActivities = (): Activity[] => {
    const cached = getCachedData(RECENT_ACTIVITIES_CACHE_KEY);
    return cached || DEFAULT_RECENT_ACTIVITIES;
  };

  // Get pinned activities (cached or default)
  const getPinnedActivities = (): string[] => {
    const cached = getCachedData(PINNED_ACTIVITIES_CACHE_KEY);
    return cached || DEFAULT_PINNED_ACTIVITIES;
  };

  // Toggle pin status of an activity
  const togglePin = (activityId: string) => {
    const currentPinned = getPinnedActivities();
    const isPinned = currentPinned.includes(activityId);

    if (isPinned) {
      // Unpin the activity
      const updatedPinned = currentPinned.filter(id => id !== activityId);
      setPinnedActivities(updatedPinned);
      setCachedData(PINNED_ACTIVITIES_CACHE_KEY, updatedPinned);
    } else {
      // Check if we're at the limit
      if (currentPinned.length >= MAX_PINNED_ACTIVITIES) {
        setErrorMessage(`Pin limit reached! Unpin an activity to add another.`);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      // Pin the activity
      const updatedPinned = [...currentPinned, activityId];
      setPinnedActivities(updatedPinned);
      setCachedData(PINNED_ACTIVITIES_CACHE_KEY, updatedPinned);
    }
  };

  // Update recent activities when an activity is selected
  const updateRecentActivities = (selectedActivity: Activity) => {
    const recentActivities = getRecentActivities();
    
    // Remove if already exists, then add to front, keep only 3
    const filteredRecent = recentActivities.filter((activity: Activity) => activity.id !== selectedActivity.id);
    const updatedRecent = [selectedActivity, ...filteredRecent].slice(0, 3);
    
    setCachedData(RECENT_ACTIVITIES_CACHE_KEY, updatedRecent);
  };

  // Convert custom activities to the same format as default activities
  const getAllActivities = (): Activity[] => {
    const formattedCustomActivities = customActivities.map((activity: CustomActivity) => ({
      id: `custom-${activity.id}`,
      label: activity.name.toUpperCase(),
      icon: activity.icon,
      category: activity.category,
      isCustom: true,
    }));

    return [...DEFAULT_RECENT_ACTIVITIES, ...formattedCustomActivities];
  };

  // Get activities to display based on search term
  const getDisplayActivities = (): Activity[] => {
    if (!searchTerm.trim()) {
      // No search term: show recent activities filtered by category
      const recentActivities = getRecentActivities();
      if (activeCategory === 'ALL') {
        return recentActivities;
      }
      return recentActivities.filter(activity => activity.category === activeCategory);
    }

    // Search term exists: search through all activities
    const allActivities = getAllActivities();
    const filteredActivities = allActivities.filter(activity => {
      const matchesSearch = activity.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || activity.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return filteredActivities;
  };

  const displayActivities = getDisplayActivities();

  // Get pinned activities for display
  const getPinnedActivitiesForDisplay = (): Activity[] => {
    if (searchTerm.trim()) return []; // Don't show pinned section when searching
    
    const allActivities = getAllActivities();
    return allActivities.filter(activity => pinnedActivities.includes(activity.id));
  };

  // Get recent activities for display (excluding pinned ones)
  const getRecentActivitiesForDisplay = (): Activity[] => {
    if (searchTerm.trim()) return displayActivities; // Show all search results
    
    return displayActivities.filter(activity => !pinnedActivities.includes(activity.id));
  };

  const pinnedActivitiesDisplay = getPinnedActivitiesForDisplay();
  const recentActivitiesDisplay = getRecentActivitiesForDisplay();

  // Show "Add to activities" when there's a search term but no search results
  const shouldShowAddOption = searchTerm.trim() && displayActivities.length === 0;

  // Activity item component with pin functionality
  const ActivityItem = ({ activity, showPinButton = true }: { activity: Activity; showPinButton?: boolean }) => {
    const isPinned = pinnedActivities.includes(activity.id);
    
    return (
      <Card key={activity.id} className="mb-3 bg-gray-800 border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 flex-1 cursor-pointer"
              onClick={() => handleActivitySelect(activity.id)}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <i className={`fas ${activity.icon} text-blue-400 text-lg`}></i>
              </div>
              <span className="text-white font-medium">{activity.label}</span>
            </div>
            {showPinButton && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(activity.id);
                }}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-700"
              >
                <i 
                  className={`fas ${isPinned ? 'fa-thumbtack' : 'fa-thumbtack'} ${
                    isPinned ? 'text-yellow-400' : 'text-gray-400'
                  } transform ${isPinned ? 'rotate-45' : ''} transition-all duration-200`}
                ></i>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleActivitySelect = (activityId: string) => {
    // Find the selected activity to update recent list
    const allActivities = getAllActivities();
    const selectedActivity = allActivities.find(activity => activity.id === activityId);
    
    if (selectedActivity) {
      updateRecentActivities(selectedActivity);
    }

    // Navigate back to add activity page with selected activity
    setLocation(`/add-activity?activity=${activityId}`);
  };

  const handleAddActivity = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter an activity name.",
        variant: "destructive",
      });
      return;
    }

    // Determine category based on activeCategory (default to STRAIN if ALL is selected)
    const category = activeCategory === 'ALL' ? 'STRAIN' : activeCategory;

    // Format the name to proper case for storage (will be uppercased for search display)
    const formattedName = searchTerm.trim().toLowerCase();

    createCustomActivityMutation.mutate({
      name: formattedName,
      category,
      icon: 'fa-dumbbell', // Default icon for custom activities
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
              placeholder="Search activities"
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

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-purple-600/90 text-white rounded-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-yellow-300"></i>
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Add Activity Option - when searching */}
        {shouldShowAddOption && (
          <Card className="mb-6 bg-gray-800 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-plus text-blue-400 text-lg"></i>
                  </div>
                  <span className="text-white font-medium">
                    Add "{searchTerm.toUpperCase()}" to activities
                  </span>
                </div>
                <Button
                  onClick={handleAddActivity}
                  disabled={createCustomActivityMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6"
                >
                  {createCustomActivityMutation.isPending ? 'ADDING...' : 'ADD'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchTerm.trim() && (
          <>
            <div className="mb-4">
              <h2 className="text-gray-400 text-sm font-medium tracking-wide">SEARCH RESULTS</h2>
            </div>
            <div className="space-y-3 mb-8">
              {displayActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} showPinButton={true} />
              ))}
            </div>
          </>
        )}

        {/* Pinned Activities Section */}
        {!searchTerm.trim() && pinnedActivitiesDisplay.length > 0 && (
          <>
            <div className="mb-4">
              <h2 className="text-gray-400 text-sm font-medium tracking-wide">PINNED</h2>
            </div>
            <div className="space-y-3 mb-6">
              {pinnedActivitiesDisplay.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} showPinButton={true} />
              ))}
            </div>
          </>
        )}

        {/* Recent Activities Section */}
        {!searchTerm.trim() && (
          <>
            <div className="mb-4">
              <h2 className="text-gray-400 text-sm font-medium tracking-wide">RECENT ACTIVITIES</h2>
            </div>
            <div className="space-y-3 mb-8">
              {recentActivitiesDisplay.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} showPinButton={true} />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {displayActivities.length === 0 && !shouldShowAddOption && searchTerm.trim() && (
          <div className="text-center py-8">
            <p className="text-gray-400">No activities found matching your search</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !searchTerm.trim() && (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading recent activities...</p>
          </div>
        )}
      </main>
    </div>
  );
}