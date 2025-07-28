import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function ResetPasswordToken() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      toast({
        title: "Invalid Link",
        description: "This password reset link is invalid or missing the token.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/forgot-password"), 3000);
      return;
    }
    
    setToken(tokenParam);
  }, [toast, setLocation]);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { 
        token, 
        newPassword 
      });

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });

      setTimeout(() => setLocation("/"), 2000);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error?.message || "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-600 to-lavender-600">
        <Card className="w-full max-w-md card-shadow">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-2xl text-white"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h1>
              <p className="text-gray-600">This password reset link is invalid or has expired.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-600 to-lavender-600">
      <Card className="w-full max-w-md card-shadow">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-lavender-500 rounded-full flex items-center justify-center">
              <i className="fas fa-key text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below.</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="mt-2"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="mt-2"
                minLength={6}
              />
            </div>

            <Button
              onClick={handleReset}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary-500 to-lavender-500 hover:from-primary-600 hover:to-lavender-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Remember your password?{" "}
              <a
                href="/"
                className="text-primary-300 hover:text-primary-400 font-semibold"
              >
                Go to login
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}