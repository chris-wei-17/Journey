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
import { calculateDuration, formatDuration } from "@/lib/utils";

const DEFAULT_ACTIVITY_OPTIONS = [
  { value: 'walking', label: 'Walking', icon: 'fa-walking' },
  { value: 'running', label: 'Running', icon: 'fa-running' },
  { value: 'cycling', label: 'Cycling', icon: 'fa-biking' },
  { value: 'sleep', label: 'Sleep', icon: 'fa-bed' },
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
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedActivity, setSelectedActivity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editActivityId, setEditActivityId] = useState<number | null>(null);
  const [originalValues, setOriginalValues] = useState({
    activityType: '',
    startTime: '',
    endTime: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

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
              const activities = await apiRequest('GET', '/api/custom-activities');
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
    label: activity.name.toUpperCase(), // Show uppercase in dropdown to match default activities
    icon: activity.icon,
  }));

  // Combine default and custom activities
  const ACTIVITY_OPTIONS = [...DEFAULT_ACTIVITY_OPTIONS, ...formattedCustomActivities];

  // Get activity from URL params if coming from select page or edit mode
  useEffect(() => {
    if (hasInitialized) return; // Prevent re-parsing on re-renders
    
    const urlParams = new URLSearchParams(window.location.search);
    const activityParam = urlParams.get('activity');
    const editParam = urlParams.get('edit');
    const activityTypeParam = urlParams.get('activityType');
    const startTimeParam = urlParams.get('startTime');
    const endTimeParam = urlParams.get('endTime');
    const dateParam = urlParams.get('date');
    
    // Set selected date from URL param if provided
    console.log('🔍 Add-Activity URL Debug - dateParam from URL:', dateParam);
    console.log('🔍 Add-Activity URL Debug - current selectedDate before update:', selectedDate);
    if (dateParam) {
      const newDate = new Date(dateParam);
      console.log('🔍 Add-Activity URL Debug - creating new Date from dateParam:', newDate);
      setSelectedDate(newDate);
      console.log('🔍 Add-Activity URL Debug - set selectedDate to:', newDate);
    } else {
      console.log('🔍 Add-Activity URL Debug - NO dateParam found, keeping default selectedDate:', selectedDate);
    }
    
    if (editParam && activityTypeParam && startTimeParam && endTimeParam) {
      // Edit mode
      setIsEditMode(true);
      setEditActivityId(parseInt(editParam));
      
      // Find the correct activity option value for the activityType
      let activityValue = activityTypeParam.toLowerCase();
      const customActivity = customActivities.find(ca => ca.name.toLowerCase() === activityTypeParam.toLowerCase());
      if (customActivity) {
        activityValue = `custom-${customActivity.id}`;
      }
      
      setSelectedActivity(activityValue);
      
      // Format times for input fields (convert from ISO to HH:MM)
      const startDate = new Date(startTimeParam);
      const endDate = new Date(endTimeParam);
      setStartTime(format(startDate, 'HH:mm'));
      setEndTime(format(endDate, 'HH:mm'));
      
      // Store original values
      setOriginalValues({
        activityType: activityValue,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm')
      });
      
      // Clean URL
      window.history.replaceState({}, '', '/add-activity');
    } else if (activityParam) {
      // Normal mode from select page
      setSelectedActivity(activityParam);
      // Clean URL
      window.history.replaceState({}, '', '/add-activity');
    }
    
    setHasInitialized(true);
  }, [customActivities, hasInitialized]);

  // Check for changes
  useEffect(() => {
    if (isEditMode) {
      const hasChanged = selectedActivity !== originalValues.activityType || 
                        startTime !== originalValues.startTime || 
                        endTime !== originalValues.endTime;
      setHasChanges(hasChanged);
    }
  }, [selectedActivity, startTime, endTime, originalValues, isEditMode]);

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      console.log('Frontend sending activity data:', activityData);
      try {
        const result = await apiRequest('POST', '/api/activities', activityData);
        console.log('Frontend received result:', result);
        return result;
      } catch (error) {
        console.error('Frontend API request error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate activities cache for all dates and specific date queries
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] && 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/activities/date/')
      });
      toast({
        title: "Success",
        description: "Activity added successfully!",
      });
      // Return to home with the selected date
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      console.log('🏠 Navigation Debug - Returning to home with date:', dateParam, 'selectedDate object:', selectedDate);
      setLocation(`/?date=${dateParam}`);
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

  const updateActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      return await apiRequest('PUT', `/api/activities/${editActivityId}`, activityData);
    },
    onSuccess: () => {
      // Invalidate activities cache for all dates and specific date queries
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] && 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/activities/date/')
      });
      toast({
        title: "Success",
        description: "Activity updated successfully!",
      });
      // Return to home with the selected date
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      setLocation(`/?date=${dateParam}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/activities/${editActivityId}`);
    },
    onSuccess: () => {
      // Invalidate activities cache for all dates and specific date queries
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] && 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/activities/date/')
      });
      toast({
        title: "Success",
        description: "Activity deleted successfully!",
      });
      // Return to home with the selected date
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      setLocation(`/?date=${dateParam}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
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

    // Determine the activity type for validation
    let activityType = selectedActivity;
    
    // If it's a custom activity, we need to extract the activity name
    if (selectedActivity.startsWith('custom-')) {
      const customActivityId = parseInt(selectedActivity.replace('custom-', ''));
      const customActivity = customActivities.find((activity: CustomActivity) => activity.id === customActivityId);
      activityType = customActivity ? customActivity.name : selectedActivity;
    }

    // Validate duration
    const duration = calculateDuration(startTime, endTime, activityType);
    if (!duration) {
      toast({
        title: "Invalid Time",
        description: activityType === 'sleep' 
          ? "Please check your sleep times." 
          : "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // Use selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let startDateTime = new Date(`${dateStr}T${startTime}`);
    let endDateTime = new Date(`${dateStr}T${endTime}`);

    // For sleep activities, handle overnight by setting end date to next day if needed
    if (activityType === 'sleep' && endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const activityData = {
      activityType: activityType,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      durationMinutes: duration.hours * 60 + duration.minutes,
      date: dateStr, // Use the date string (YYYY-MM-DD) instead of full timestamp
    };

    console.log('🚀 Activity Creation Debug:');
    console.log('Selected Date Object:', selectedDate);
    console.log('Selected Date ISO:', selectedDate.toISOString());
    console.log('Selected Date Local String:', selectedDate.toString());
    console.log('Date String (dateStr):', dateStr);
    console.log('Activity Data:', activityData);

    if (isEditMode) {
      updateActivityMutation.mutate(activityData);
    } else {
      createActivityMutation.mutate(activityData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteActivityMutation.mutate();
    }
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
          onClick={() => {
            const dateParam = format(selectedDate, 'yyyy-MM-dd');
            setLocation(`/?date=${dateParam}`);
          }}
          className="p-2 text-white hover:bg-white/20"
        >
          <i className="fas fa-chevron-left text-xl"></i>
        </Button>
        <h1 className="text-xl font-bold text-white">{isEditMode ? 'EDIT ACTIVITY' : 'ADD ACTIVITY'}</h1>
        <div 
          onClick={() => {
            const dateParam = format(selectedDate, 'yyyy-MM-dd');
            setLocation(`/?date=${dateParam}`);
          }}
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
          disabled={
            isEditMode 
              ? !hasChanges || updateActivityMutation.isPending 
              : createActivityMutation.isPending
          }
          className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditMode 
            ? (updateActivityMutation.isPending ? 'UPDATING...' : 'UPDATE') 
            : (createActivityMutation.isPending ? 'SAVING...' : 'SAVE')
          }
        </Button>

        {/* Delete Button - Only show in edit mode */}
        {isEditMode && (
          <Button 
            onClick={handleDelete}
            disabled={deleteActivityMutation.isPending}
            variant="destructive"
            className="w-full py-3 rounded-lg transition-all duration-200 mb-8"
          >
            {deleteActivityMutation.isPending ? 'DELETING...' : 'DELETE ACTIVITY'}
          </Button>
        )}
      </main>
    </div>
  );
}