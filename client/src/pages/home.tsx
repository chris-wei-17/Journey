import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Photo, ProgressEntry } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  
  const { data: photos } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const { data: progress } = useQuery<ProgressEntry[]>({
    queryKey: ["/api/progress"],
  });

  const handleLogout = () => {
    // Clear the auth token and reload to show auth page
    localStorage.removeItem('authToken');
    window.location.reload();
  };

  const handleSettings = () => {
    // TODO: Implement settings/profile editing
    console.log("Settings clicked");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-300 to-lavender-300 flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-white text-sm"></i>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  Welcome back, {user?.profile?.username || user?.firstName || "Fitness Friend"}!
                </h2>
                <p className="text-sm text-gray-600">Ready for today's journey?</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSettings}
                className="text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-cog text-xl"></i>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-sign-out-alt text-xl"></i>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-primary-300 to-lavender-300 text-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Welcome to FitJourney!</h3>
              <p className="text-primary-100">Your personalized fitness experience awaits!</p>
            </CardContent>
          </Card>

          {/* Goals Summary */}
          {user?.goals && user.goals.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Goals</h3>
                <div className="grid grid-cols-2 gap-3">
                  {user.goals.map((goal: string) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
                      <span className="text-sm text-gray-700 capitalize">
                        {goal.replace('-', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Progress */}
          {progress && progress.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Progress</h3>
                <div className="space-y-3">
                  {progress.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 capitalize">
                        {entry.goalType.replace('-', ' ')}
                      </span>
                      <span className="text-sm font-semibold text-primary-300">
                        {entry.progressValue}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Photos */}
          {photos && photos.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Photos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {photos.slice(0, 6).map((photo) => (
                    <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={`/api/photos/${photo.filename}`}
                        alt="Progress photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button className="bg-secondary-300 hover:bg-secondary-400 text-white">
                  <i className="fas fa-camera mr-2"></i>
                  Add Photo
                </Button>
                <Button className="bg-accent-300 hover:bg-accent-400 text-gray-800">
                  <i className="fas fa-chart-line mr-2"></i>
                  Update Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
