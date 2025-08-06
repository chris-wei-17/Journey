import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState } from "react";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast({
        title: "Password Updated",
        description: "Your password was successfully changed.",
      });

      setLocation("/profile");
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Current password may be incorrect.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-gradient-bg">
      <Header 
        title="Change Password"
        showBackButton={true}
        onBack={() => setLocation("/profile")}
      />

      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-2xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Update Your Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
            </div>

            <Button 
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full shadow-md hover:shadow-lg transition-shadow"
            >
              {loading ? "Updating..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}