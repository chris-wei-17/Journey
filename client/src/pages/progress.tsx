import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Progress() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-300 to-lavender-300">
      <Header 
        title="Progress"
        showBackButton={true}
        onBack={handleBack}
      />
      
      <div className="pt-20 px-4 pb-6">
        <div className="space-y-6">
          {/* Main Content Card */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                <i className="fas fa-chart-line text-blue-500 mr-3"></i>
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                  <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Progress Tracking
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Track your fitness journey with detailed progress metrics and analytics.
                  </p>
                  <Button
                    onClick={() => setLocation('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <i className="fas fa-home mr-2"></i>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-trophy text-yellow-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-fire text-red-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}