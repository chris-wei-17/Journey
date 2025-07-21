import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Link } from "wouter";
import { Activity } from "@shared/schema";

interface MyDayBlockProps {
  selectedDate: Date;
}

export function MyDayBlock({ selectedDate }: MyDayBlockProps) {
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: [`/api/activities/date/${format(selectedDate, 'yyyy-MM-dd')}`],
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'walking':
        return 'fa-walking';
      case 'running':
        return 'fa-running';
      case 'cycling':
        return 'fa-biking';
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
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, 'h:mm a');
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">My Day</CardTitle>
          <i className="fas fa-edit text-gray-400"></i>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-600 mb-3">
            <span>ACTIVITIES</span>
          </div>
          
          {activities.length > 0 ? (
            activities.map((activity: Activity) => (
              <div key={activity.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className={`${getActivityColor(activity.activityType || '')} rounded-lg p-2 flex items-center justify-center min-w-[48px] h-12`}>
                    <i className={`fas ${getActivityIcon(activity.activityType || '')} text-white text-sm`}></i>
                  </div>
                  <div>
                    <div className="text-white font-medium capitalize">
                      {activity.activityType || 'Activity'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-gray-300 text-sm">
                  <div>{activity.startTime && formatTime(activity.startTime)}</div>
                  <div>{activity.endTime && formatTime(activity.endTime)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">
              No activities logged {isToday(selectedDate) ? 'today' : 'for this date'}
            </div>
          )}
        </div>
        
        <Link href="/add-activity">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-200">
            <i className="fas fa-plus mr-2"></i>
            ADD ACTIVITY
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}