import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-300 to-lavender-300">
      <Card className="w-full max-w-md card-shadow">
        <CardContent className="p-8">
          {/* App Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-300 to-lavender-300 rounded-full flex items-center justify-center">
              <i className="fas fa-dumbbell text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">FitJourney</h1>
            <p className="text-gray-600">Your personal fitness companion</p>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to FitJourney</h2>
            <p className="text-gray-600 text-sm">
              Track your fitness progress, set goals, and document your journey with photos and insights.
            </p>
          </div>

          {/* Login Button */}
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-primary-300 to-lavender-300 hover:from-primary-400 hover:to-lavender-400 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sign in to start your fitness journey
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
