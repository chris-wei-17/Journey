import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Link, useLocation } from "wouter";
import { Activity } from "@shared/schema";
import { formatActivityName, calculateDuration, formatDuration } from "@/lib/utils";

interface MyDayBlockProps {
  selectedDate: Date;
}

export function MyDayBlock({ selectedDate }: MyDayBlockProps) {
  const [, setLocation] = useLocation();
  
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: [`/api/activities/date/${format(selectedDate, 'yyyy-MM-dd')}`],
  });

  // Sort activities by start time (earliest first)
  const sortedActivities = [...activities].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const handleEditActivity = (activity: Activity) => {
    // Navigate to add-activity page with edit parameters
    setLocation(`/add-activity?edit=${activity.id}&activityType=${encodeURIComponent(activity.activityType || '')}&startTime=${encodeURIComponent(activity.startTime || '')}&endTime=${encodeURIComponent(activity.endTime || '')}&date=${encodeURIComponent(activity.date || '')}`);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'walking':
        return 'fa-walking';
      case 'running':
        return 'fa-running';
      case 'cycling':
        return 'fa-biking';
      case 'sleep':
        return 'fa-bed';
      default:
        return 'fa-dumbbell';
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'walking':
        return 'bg-blue-500';
      case 'running':
        return 'bg-green-500';
      case 'cycling':
        return 'bg-yellow-500';
      case 'sleep':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, 'h:mm a');
  };



  return (
    <Card className="mb-2 bg-white/75 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">My Day</CardTitle>
          <span className="text-xs text-gray-500">Tap activity to edit</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          
          {sortedActivities.length > 0 ? (
            sortedActivities.map((activity: Activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                onClick={() => handleEditActivity(activity)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${getActivityColor(activity.activityType || '')} rounded-lg p-2 flex items-center justify-center min-w-[48px] h-12`}>
                    <i className={`fas ${getActivityIcon(activity.activityType || '')} text-white text-sm`}></i>
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {formatActivityName(activity.activityType || '')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Duration display */}
                  <div className="text-gray-300 text-sm font-medium">
                    {activity.startTime && activity.endTime && 
                      formatDuration(calculateDuration(
                        format(new Date(activity.startTime), 'HH:mm'), 
                        format(new Date(activity.endTime), 'HH:mm'), 
                        activity.activityType
                      ))
                    }
                  </div>
                  
                  {/* Start and end times */}
                  <div className="text-right text-gray-300 text-sm">
                    <div>{activity.startTime && formatTime(activity.startTime)}</div>
                    <div>{activity.endTime && formatTime(activity.endTime)}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-2">
              No activities logged {isToday(selectedDate) ? 'today' : 'for this date'}
            </div>
          )}
        </div>
        
        <Link href={`/add-activity?date=${format(selectedDate, 'yyyy-MM-dd')}`} onClick={() => {
          const dateParam = format(selectedDate, 'yyyy-MM-dd');
          console.log('🔗 MyDayBlock Link Debug - selectedDate:', selectedDate);
          console.log('🔗 MyDayBlock Link Debug - formatted date param:', dateParam);
          console.log('🔗 MyDayBlock Link Debug - full URL:', `/add-activity?date=${dateParam}`);
        }}>
          <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-200">
            <i className="fas fa-plus mr-2"></i>
            ADD ACTIVITY
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}