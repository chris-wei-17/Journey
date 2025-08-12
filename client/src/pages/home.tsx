import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DateNavigation } from "@/components/date-navigation";
import { MyDayBlock } from "@/components/my-day-block";
import { MacrosBlock } from "@/components/macros-block";
import { MetricsBlock } from "@/components/metrics-block";
import { PhotosBlock } from "@/components/photos-block";
import { format, isToday } from "date-fns";
import { createDateFromString } from "@/lib/date-utils";
// Donut charts for macros are displayed within MacrosBlock

export default function Home() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Check for date parameter in URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    console.log('🏠🏠🏠 DETAILED Home Page URL Debug:');
    console.log('1. Current URL:', window.location.href);
    console.log('2. URL Search Params:', window.location.search);
    console.log('3. dateParam from URL:', dateParam);
    console.log('4. Current selectedDate before update:', selectedDate);
    console.log('5. Current selectedDate toString():', selectedDate.toString());
    
    if (dateParam) {
      const newDate = createDateFromString(dateParam); // Use timezone-safe date creation
      console.log('6. Creating new Date from dateParam using createDateFromString:', dateParam);
      console.log('7. New Date Object:', newDate);
      console.log('8. New Date toString():', newDate.toString());
      console.log('9. New Date toDateString():', newDate.toDateString());
      console.log('10. New Date getDate():', newDate.getDate());
      console.log('11. New Date getMonth():', newDate.getMonth());
      console.log('12. New Date getFullYear():', newDate.getFullYear());
      
      setSelectedDate(newDate);
      console.log('13. Set selectedDate to new date');
      
      // Clean URL to remove the parameter
      window.history.replaceState({}, '', '/');
      console.log('14. Cleaned URL');
    } else {
      console.log('6. NO dateParam found, keeping selectedDate as:', selectedDate.toString());
    }
  }, []);

  // Use date-specific query when not today
  const { data: progressData = [] } = useQuery({
    queryKey: isToday(selectedDate) 
      ? ["/api/progress"] 
      : [`/api/progress/date/${format(selectedDate, 'yyyy-MM-dd')}`],
    enabled: !!user,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["/api/photos"],
    enabled: !!user,
  });

  // Debug logging for photos
  console.log('Home page - photos:', photos);
  console.log('Home page - photos length:', photos.length);

  const getMotivationalMessage = () => {
    const messages = [
      "Every step counts! Keep pushing forward.",
      "You're stronger than yesterday.",
      "Progress, not perfection.",
      "Your only competition is who you were yesterday.",
      "Believe in yourself and keep going!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getProgressSummary = () => {
    if (!progressData || !Array.isArray(progressData) || progressData.length === 0) return null;
    
    const avgProgress = progressData.reduce((sum: number, item: any) => sum + (item.progressValue || 0), 0) / progressData.length;
    return Math.round(avgProgress);
  };

  return (
    <>
      <Header />
      <div className="app-gradient-bg">
        <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <h2 className="text-gray-800 text-lg flex mb-6 items-center">
            {getMotivationalMessage()}
          </h2>
          
          {/* Date Navigation */}
          <DateNavigation 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 mb-4 gap-x-4">
        {/* My Day Block */}
        <MyDayBlock selectedDate={selectedDate} />

        {/* Metrics Block */}
        <MetricsBlock selectedDate={selectedDate} />

        {/* Photos Block */}
        <PhotosBlock selectedDate={selectedDate} />

        {/* Macros Block */}
        <MacrosBlock selectedDate={selectedDate} />
        {/* Stats Overview */}
        </div>

        {/* Macro donuts are shown inside MacrosBlock */}
 
        {/* <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4 mt-4">
          <Card className="bg-white/75 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-chart-line mr-2" style={{ color: "#ec4899" }}></i>
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {getProgressSummary() || 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Average across all goals</p>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-camera mr-2" style={{ color: "#2dd4bf" }}></i>
                Progress Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {Array.isArray(photos) ? photos.length : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Photos uploaded</p>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-target mr-2" style={{ color: "#fbbf24" }}></i>
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {Array.isArray(progressData) ? progressData.length : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Goals being tracked</p>
            </CardContent>
          </Card>
        </div> */}



        {/* Recent Progress */}
        {Array.isArray(progressData) && progressData.length > 0 && (
          <Card className="bg-white/75 backdrop-blur-sm shadow-xl mt-8 border-0" style={{
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: "#ec4899" }}
                      ></div>
                      <span className="font-medium text-gray-700 capitalize">
                        {item.goalType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-lg font-bold"
                        style={{ color: "#be185d" }}
                      >
                        {item.progressValue}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </main>
      </div>
    </>
  );
}