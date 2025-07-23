import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginData } from "@shared/schema";

interface LoginProps {
  onToggleMode: () => void;
}

export default function Login({ onToggleMode }: LoginProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response;
    },
    onSuccess: async (data) => {
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      
      // Instead of reloading, fetch user data and update cache
      try {
        const userResponse = await apiRequest("GET", "/api/user");
        queryClient.setQueryData(["/api/user"], userResponse);
        console.log("Login successful, user data updated:", userResponse);
      } catch (error) {
        console.error("Failed to fetch user data after login:", error);
        // If user fetch fails, fall back to reload
        window.location.reload();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
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
            <p className="text-gray-600">Welcome back!</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="on" data-form-type="login">
            {/* Hidden field to help iOS Safari recognize this as login form */}
            <input type="hidden" name="login-form" value="true" />
            
            <div>
              <Label htmlFor="login-username">Username or Email</Label>
              <Input
                id="login-username"
                name="username"
                {...register("usernameOrEmail")}
                placeholder="Enter your username or email"
                className="mt-2"
                autoComplete="username"
                inputMode="email"
                data-form-type="login"
              />
              {errors.usernameOrEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.usernameOrEmail.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                className="mt-2"
                autoComplete="current-password"
                data-form-type="login"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-primary-300 to-lavender-300 hover:from-primary-400 hover:to-lavender-400 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={onToggleMode}
                className="text-primary-300 hover:text-primary-400 font-semibold"
              >
                Create Account
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}