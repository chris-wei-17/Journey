import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, hsl(var(--primary-50)) 0%, hsl(var(--lavender-50)) 50%, hsl(var(--secondary-50)) 100%)"
    }}>
      <Header />
      
      <main className="p-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 hover:bg-white/50"
            >
              <i className="fas fa-arrow-left text-lg"></i>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Profile & Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-8 border-0" style={{
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <Avatar
                firstName={user?.firstName || undefined}
                lastName={user?.lastName || undefined}
                profileImageUrl={user?.profileImageUrl || undefined}
                size="lg"
                editable={false}
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500">Username: {user?.username}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button variant="outline" className="w-full shadow-md">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0" style={{
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
                <i className="fas fa-bell mr-3"></i>
                Notifications
              </Button>
              
              <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
                <i className="fas fa-lock mr-3"></i>
                Privacy
              </Button>
              
              <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
                <i className="fas fa-chart-bar mr-3"></i>
                Data Export
              </Button>
              
              <hr className="my-6" />
              
              <Button 
                onClick={handleLogout}
                variant="destructive" 
                className="w-full shadow-md hover:shadow-lg transition-shadow"
              >
                <i className="fas fa-sign-out-alt mr-3"></i>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}