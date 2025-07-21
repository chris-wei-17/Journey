import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export default function Profile() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-lavender-50 to-secondary-50">
      <Header />
      
      <main className="p-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg mb-8">
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
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <i className="fas fa-bell mr-3"></i>
                Notifications
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <i className="fas fa-lock mr-3"></i>
                Privacy
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <i className="fas fa-chart-bar mr-3"></i>
                Data Export
              </Button>
              
              <hr className="my-6" />
              
              <Button 
                onClick={handleLogout}
                variant="destructive" 
                className="w-full"
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