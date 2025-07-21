import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ACTIVITY_OPTIONS = [
  { value: 'walking', label: 'Walking', icon: 'fa-walking' },
  { value: 'running', label: 'Running', icon: 'fa-running' },
  { value: 'cycling', label: 'Cycling', icon: 'fa-biking' },
  { value: 'acupuncture', label: 'Acupuncture', icon: 'fa-spa' },
  { value: 'air-compression', label: 'Air Compression', icon: 'fa-wind' },
  { value: 'assault-bike', label: 'Assault Bike', icon: 'fa-biking' },
  { value: 'australian-rules-football', label: 'Australian Rules Football', icon: 'fa-football-ball' },
  { value: 'babywearing', label: 'Babywearing', icon: 'fa-baby' },
  { value: 'badminton', label: 'Badminton', icon: 'fa-shuttlecock' },
  { value: 'barre', label: 'Barre', icon: 'fa-dumbbell' },
];

export default function AddActivity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedActivity, setSelectedActivity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setActivityLocation] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
      return apiRequest('/api/activities', 'POST', activityData);
    },
    onSuccess: () => {
      // Invalidate activities cache
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Success",
        description: "Activity added successfully!",
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      console.error('Error creating activity:', error);
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

    const activityDate = new Date(date);
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    createActivityMutation.mutate({
      activityType: selectedActivity,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      date: activityDate.toISOString(),
      location: location || null,
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
          <i className="fas fa-times text-xl"></i>
        </Button>
        <h1 className="text-xl font-bold text-white">ADD ACTIVITY</h1>
        <div className="w-8"></div> {/* Spacer for centering */}
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

            <div>
              <Label className="text-white mb-2 block">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="mb-8">
          <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">LOCATION</h3>
          <div>
            <Label className="text-white mb-2 block">Where did you do this activity?</Label>
            <Input
              type="text"
              placeholder="---"
              value={location}
              onChange={(e) => setActivityLocation(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
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