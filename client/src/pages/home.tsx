import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DateNavigation } from "@/components/date-navigation";
import { MyDayBlock } from "@/components/my-day-block";
import { format, isToday } from "date-fns";

export default function Home() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    <div className="app-gradient-bg">
      <Header />
      
      <main className="p-4 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-gray-600 text-lg mb-4 h-16 flex items-center">
            {getMotivationalMessage()}
          </p>
          
          {/* Date Navigation */}
          <DateNavigation 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* My Day Block */}
        <MyDayBlock selectedDate={selectedDate} />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
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

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
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

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
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
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0" style={{
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/progress">
                <Button 
                  className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
                  style={{
                    background: "linear-gradient(135deg, #ec4899, #db2777)",
                    boxShadow: "0 10px 25px rgba(236, 72, 153, 0.3)"
                  }}
                >
                  <i className="fas fa-plus text-lg"></i>
                  <span className="text-sm">Log Progress</span>
                </Button>
              </Link>

              <Link href="/photos">
                <Button 
                  className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
                  style={{
                    background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
                    boxShadow: "0 10px 25px rgba(45, 212, 191, 0.3)"
                  }}
                >
                  <i className="fas fa-camera text-lg"></i>
                  <span className="text-sm">Add Photos</span>
                </Button>
              </Link>

              <Link href="/goals">
                <Button 
                  className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    boxShadow: "0 10px 25px rgba(251, 191, 36, 0.3)"
                  }}
                >
                  <i className="fas fa-target text-lg"></i>
                  <span className="text-sm">View Goals</span>
                </Button>
              </Link>

              <Link href="/workouts">
                <Button 
                  className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #9333ea)",
                    boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)"
                  }}
                >
                  <i className="fas fa-dumbbell text-lg"></i>
                  <span className="text-sm">Workouts</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress */}
        {Array.isArray(progressData) && progressData.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl mt-8 border-0" style={{
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
  );
}