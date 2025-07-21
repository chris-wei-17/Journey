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
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, hsl(var(--primary-50)) 0%, hsl(var(--lavender-50)) 50%, hsl(var(--secondary-50)) 100%)"
    }}>
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
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <i className="fas fa-chart-line mr-2" style={{ color: "hsl(var(--primary-300))" }}></i>
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
                <i className="fas fa-camera mr-2" style={{ color: "hsl(var(--secondary-300))" }}></i>
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
                <i className="fas fa-target mr-2" style={{ color: "hsl(var(--accent-300))" }}></i>
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
                    background: `linear-gradient(135deg, hsl(var(--primary-300)), hsl(var(--primary-400)))`,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
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
                    background: `linear-gradient(135deg, hsl(var(--secondary-300)), hsl(var(--secondary-400)))`,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
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
                    background: `linear-gradient(135deg, hsl(var(--accent-300)), hsl(var(--accent-400)))`,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
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
                    background: `linear-gradient(135deg, hsl(var(--lavender-300)), hsl(var(--lavender-400)))`,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
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
                        style={{ backgroundColor: "hsl(var(--primary-300))" }}
                      ></div>
                      <span className="font-medium text-gray-700 capitalize">
                        {item.goalType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-lg font-bold"
                        style={{ color: "hsl(var(--primary-600))" }}
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