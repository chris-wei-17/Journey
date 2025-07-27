import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleReset = async () => {
    if (!email) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/request-password-reset", { email });

      toast({
        title: "Reset Link Sent",
        description: "If your email is registered, a reset link was sent.",
      });

      setTimeout(() => setLocation("/"), 2000);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-600 to-lavender-600">
      {/*<Card className="w-full max-w-md card-shadow">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-lavender-500 rounded-full flex items-center justify-center">
              <i className="fas fa-envelope-open-text text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">We’ll email you a link to reset it.</p>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleReset}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary-500 to-lavender-500 hover:from-primary-600 hover:to-lavender-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Remembered your password?{" "}
              <a
                href="/"
                className="text-primary-300 hover:text-primary-400 font-semibold"
              >
                Go back to login
              </a>
            </p>
          </div>
        </CardContent>
      </Card>*/}
    </div>
  );
}