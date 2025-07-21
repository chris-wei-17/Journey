import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const { data: progressData = [] } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["/api/photos"],
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-lavender-50 to-secondary-50">
      <Header />
      
      <main className="p-4 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.firstName || user?.username}!
          </h1>
          <p className="text-gray-600 text-lg">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-chart-line text-primary-300 mr-2"></i>
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

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-camera text-secondary-300 mr-2"></i>
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

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-target text-accent-300 mr-2"></i>
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
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/progress">
                <Button className="w-full h-20 bg-gradient-to-br from-primary-300 to-primary-400 hover:from-primary-400 hover:to-primary-500 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <i className="fas fa-plus text-lg"></i>
                  <span className="text-sm">Log Progress</span>
                </Button>
              </Link>

              <Link href="/photos">
                <Button className="w-full h-20 bg-gradient-to-br from-secondary-300 to-secondary-400 hover:from-secondary-400 hover:to-secondary-500 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <i className="fas fa-camera text-lg"></i>
                  <span className="text-sm">Add Photos</span>
                </Button>
              </Link>

              <Link href="/goals">
                <Button className="w-full h-20 bg-gradient-to-br from-accent-300 to-accent-400 hover:from-accent-400 hover:to-accent-500 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <i className="fas fa-target text-lg"></i>
                  <span className="text-sm">View Goals</span>
                </Button>
              </Link>

              <Link href="/workouts">
                <Button className="w-full h-20 bg-gradient-to-br from-lavender-300 to-lavender-400 hover:from-lavender-400 hover:to-lavender-500 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <i className="fas fa-dumbbell text-lg"></i>
                  <span className="text-sm">Workouts</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress */}
        {Array.isArray(progressData) && progressData.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
                      <span className="font-medium text-gray-700 capitalize">
                        {item.goalType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-primary-600">
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