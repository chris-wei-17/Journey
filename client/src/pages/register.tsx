import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest as api } from "@/lib/queryClient";
import { registerSchema, type RegisterData } from "@shared/schema";
import { useState } from "react";

interface RegisterProps {
  onToggleMode?: () => void;
}

export default function Register({ onToggleMode }: RegisterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const checkUsername = async (value: string) => {
    if (!value) return;
    setCheckingUsername(true);
    try {
      const res = await api('GET', `/api/availability?username=${encodeURIComponent(value)}`);
      setUsernameError(res.usernameAvailable ? null : 'Username is already taken');
    } catch {
      setUsernameError(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmail = async (value: string) => {
    if (!value) return;
    setCheckingEmail(true);
    try {
      const res = await api('GET', `/api/availability?email=${encodeURIComponent(value)}`);
      setEmailError(res.emailAvailable ? null : 'Email is already in use');
    } catch {
      setEmailError(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api("POST", "/api/register", data);
      return response;
    },
    onSuccess: async (data) => {
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      toast({
        title: "Account Created!",
        description: "Welcome to Journey! Let's set up your profile.",
      });
      
      // Instead of reloading, fetch user data and update cache
      try {
        const userResponse = await api("GET", "/api/user");
        queryClient.setQueryData(["/api/user"], userResponse);
        console.log("Registration successful, user data updated:", userResponse);
        // Navigate to dashboard
        setLocation('/home');
      } catch (error) {
        console.error("Failed to fetch user data after registration:", error);
        // Navigate to dashboard even if fetch fails; cache will hydrate later
        setLocation('/home');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterData) => {
    if (usernameError || emailError) {
      toast({ title: 'Please fix errors', description: 'Username or email is unavailable.', variant: 'destructive' });
      return;
    }
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-600 to-lavender-600">
      <Card className="w-full max-w-md card-shadow">
        <CardContent className="p-8">
          {/* App Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-lavender-500 rounded-full flex items-center justify-center">
              <i className="fas fa-dumbbell text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Journey</h1>
            <p className="text-gray-600">Create your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="on" data-form-type="register">
            {/* Hidden field to help iOS Safari recognize this as registration form */}
            <input type="hidden" name="signup-form" value="true" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="given-name"
                  {...register("firstName")}
                  placeholder="First name"
                  className="mt-2"
                  autoComplete="given-name"
                  data-form-type="register"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="family-name"
                  {...register("lastName")}
                  placeholder="Last name"
                  className="mt-2"
                  autoComplete="family-name"
                  data-form-type="register"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="register-username">Username</Label>
              <Input
                id="register-username"
                name="username"
                {...register("username")}
                placeholder="Choose a unique username"
                className="mt-2"
                autoComplete="username"
                data-form-type="register"
                onBlur={(e) => checkUsername(e.target.value)}
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
              )}
              {usernameError && !errors.username && (
                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                name="email"
                type="email"
                {...register("email")}
                placeholder="Enter your email address"
                className="mt-2"
                autoComplete="email"
                data-form-type="register"
                onBlur={(e) => checkEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
              {emailError && !errors.email && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                name="password"
                type="password"
                {...register("password")}
                placeholder="Create a secure password"
                className="mt-2"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                autoCapitalize="none"
                data-form-type="register"
                data-webkit-autofill="off"
                data-1p-ignore="true"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit"
              disabled={registerMutation.isPending}
                              className="w-full bg-gradient-to-r from-primary-500 to-lavender-500 hover:from-primary-600 hover:to-lavender-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onToggleMode || (() => setLocation("/login"))}
                className="text-primary-300 hover:text-primary-400 font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}