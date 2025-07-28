import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Call logout endpoint for server-side logging and cleanup
      await apiRequest("POST", "/api/logout");
      
      // Clear authentication token
      localStorage.removeItem('authToken');
      
      // Clear all cached queries
      queryClient.clear();
      
      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out. See you next time!",
      });
      
      // Small delay to show the toast, then redirect
      setTimeout(() => {
        // Force reload to reset app state and redirect to login
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server call fails, still logout locally
      localStorage.removeItem('authToken');
      queryClient.clear();
      window.location.href = '/';
    }
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="app-gradient-bg">
      <Header 
        title="Profile & Settings"
        showBackButton={true}
        onBack={handleBack}
        showHomeButton={true}
      />
      
      <main className="pt-28 p-4 max-w-4xl mx-auto"> {/* Add pt-28 */}
        {/* Remove the duplicate back button */}
        <div className="mb-6">
          <div>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>
        </div>

        {/* Profile Section */}
        <Card className="bg-white/75 backdrop-blur-sm shadow-xl mb-8 border-0" style={{
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
              <Button 
                variant="outline" 
                className="w-full shadow-md"
                onClick={() => setLocation('/edit-profile')}
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0" style={{
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
              <Button 
                onClick={() => setLocation("/reset-password")}
                variant="outline" 
                className="w-full justify-start shadow-sm hover:shadow-md transition-shadow"
              >
                <i className="fas fa-key mr-3"></i>
                Change Password
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