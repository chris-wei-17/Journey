import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_ACTIVITY_OPTIONS = [
  { value: 'walking', label: 'Walking', icon: 'fa-walking' },
  { value: 'running', label: 'Running', icon: 'fa-running' },
  { value: 'cycling', label: 'Cycling', icon: 'fa-biking' },
];

// Cache key for localStorage - same as select-activity page
const CUSTOM_ACTIVITIES_CACHE_KEY = 'journey_custom_activities';

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

export default function AddActivity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedActivity, setSelectedActivity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch custom activities
  const { data: customActivities = [] } = useQuery({
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

  // Cache management functions
  const getCachedCustomActivities = (): CustomActivity[] | null => {
    try {
      const cached = localStorage.getItem(CUSTOM_ACTIVITIES_CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedCustomActivities = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > maxAge) {
        localStorage.removeItem(CUSTOM_ACTIVITIES_CACHE_KEY);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
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
    value: `custom-${activity.id}`,
    label: activity.name, // Already in all caps from database
    icon: activity.icon,
  }));

  // Combine default and custom activities
  const ACTIVITY_OPTIONS = [...DEFAULT_ACTIVITY_OPTIONS, ...formattedCustomActivities];

  // Get activity from URL params if coming from select page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const activityParam = urlParams.get('activity');
    if (activityParam) {
      setSelectedActivity(activityParam);
      // Clean URL
      window.history.replaceState({}, '', '/add-activity');
    }
  }, []);

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      console.log('Frontend sending activity data:', activityData);
      try {
        const result = await apiRequest('/api/activities', 'POST', activityData);
        console.log('Frontend received result:', result);
        return result;
      } catch (error) {
        console.error('Frontend API request error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate activities cache for all dates
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      // Also invalidate the specific date query
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: [`/api/activities/date/${today}`] });
      toast({
        title: "Success",
        description: "Activity added successfully!",
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      console.error('Frontend mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedActivity || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Use today's date automatically
    const today = format(new Date(), 'yyyy-MM-dd');
    const startDateTime = new Date(`${today}T${startTime}`);
    const endDateTime = new Date(`${today}T${endTime}`);

    // Determine the activity type for the database
    let activityType = selectedActivity;
    
    // If it's a custom activity, we need to extract the activity name
    if (selectedActivity.startsWith('custom-')) {
      const customActivityId = parseInt(selectedActivity.replace('custom-', ''));
      const customActivity = customActivities.find((activity: CustomActivity) => activity.id === customActivityId);
      activityType = customActivity ? customActivity.name : selectedActivity;
    }

    createActivityMutation.mutate({
      activityType: activityType,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      date: new Date(today).toISOString(),
    });
  };

  const getSelectedActivityIcon = () => {
    const activity = ACTIVITY_OPTIONS.find(opt => opt.value === selectedActivity);
    return activity ? activity.icon : 'fa-dumbbell';
  };

  const getSelectedActivityLabel = () => {
    const activity = ACTIVITY_OPTIONS.find(opt => opt.value === selectedActivity);
    return activity ? activity.label : 'SELECT ACTIVITY';
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/')}
          className="p-2 text-white hover:bg-white/20"
        >
          <i className="fas fa-chevron-left text-xl"></i>
        </Button>
        <h1 className="text-xl font-bold text-white">ADD ACTIVITY</h1>
        <div 
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center cursor-pointer text-black bg-white/90 hover:bg-white rounded-full"
        >
          <i className="fas fa-times text-xl text-black"></i>
        </div>
      </div>

      <main className="px-4 max-w-lg mx-auto">
        {/* Activity Selection */}
        <Card 
          className="mb-6 bg-gray-800 border-0 cursor-pointer hover:bg-gray-700 transition-all duration-200"
          onClick={() => setLocation('/select-activity')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className={`fas ${getSelectedActivityIcon()} text-gray-400 text-lg`}></i>
                </div>
                <span className="text-white font-medium">{getSelectedActivityLabel()}</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
          </CardContent>
        </Card>

        {/* Time Section */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">TIME</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2 block">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-white mb-2 block">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSubmit}
          disabled={createActivityMutation.isPending}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg transition-all duration-200 mb-8"
        >
          {createActivityMutation.isPending ? 'SAVING...' : 'SAVE'}
        </Button>
      </main>
    </div>
  );
}