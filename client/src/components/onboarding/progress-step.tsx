import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import PhotoUpload from "@/components/ui/photo-upload";
import { OnboardingData } from "@/pages/onboarding";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const GOAL_LABELS: Record<string, string> = {
  "general-fitness": "General Fitness",
  "cardio": "Cardio",
  "strength": "Strength",
  "muscle-mass": "Muscle Mass",
  "weight-loss": "Weight Loss",
  "improve-diet": "Improve Diet",
};

interface ProgressStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function ProgressStep({ data, updateData }: ProgressStepProps) {
  const [progress, setProgress] = useState<Record<string, number>>(data.progress);
  const [photos, setPhotos] = useState<File[]>(data.photos);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize progress for selected goals
    const initialProgress: Record<string, number> = {};
    data.goals.forEach(goal => {
      initialProgress[goal] = progress[goal] || 50;
    });
    setProgress(initialProgress);
    updateData({ progress: initialProgress });
  }, [data.goals]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      // First complete onboarding
      await apiRequest("POST", "/api/onboarding/complete", {
        // username is already part of the user object, not in onboarding data
        gender: data.gender,
        birthday: data.birthday,
        height: data.height,
        weight: data.weight,
        bodyType: data.bodyType,
        goals: data.goals,
        progress,
      });

      // Then upload photos if any
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('photos', photo);
        });
        await fetch('/api/photos', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Welcome to FitJourney!",
        description: "Your account has been created successfully.",
      });
      // Reload to trigger auth check and redirect to home
      window.location.reload();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProgress = (goalType: string, value: number[]) => {
    const newProgress = { ...progress, [goalType]: value[0] };
    setProgress(newProgress);
    updateData({ progress: newProgress });
  };

  const handlePhotosChange = (newPhotos: File[]) => {
    setPhotos(newPhotos);
    updateData({ photos: newPhotos });
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  return (
    <Card className="card-shadow slide-in">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Current Progress</h2>
        <p className="text-gray-600 text-center mb-8">Rate your current level in each selected area</p>

        {/* Progress Sliders */}
        <div className="space-y-6 mb-8">
          {data.goals.map((goalType) => (
            <div key={goalType} className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-700">
                  {GOAL_LABELS[goalType]}
                </Label>
                <span className="text-sm font-semibold text-primary-300">
                  {progress[goalType] || 50}%
                </span>
              </div>
              <Slider
                value={[progress[goalType] || 50]}
                onValueChange={(value) => updateProgress(goalType, value)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Photo Upload Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Photos (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">Upload up to 5 photos to track your visual progress</p>
          
          <PhotoUpload
            photos={photos}
            onPhotosChange={handlePhotosChange}
            maxPhotos={5}
          />
        </div>

        <Button 
          onClick={handleComplete}
          disabled={completeMutation.isPending}
          className="w-full bg-gradient-to-r from-primary-300 to-lavender-300 hover:from-primary-400 hover:to-lavender-400 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 text-center"
        >
          {completeMutation.isPending ? "Creating Account..." : "Create My Account"}
        </Button>
      </CardContent>
    </Card>
  );
}
