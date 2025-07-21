import { useState } from "react";
import ProfileStep from "@/components/onboarding/profile-step";
import GoalsStep from "@/components/onboarding/goals-step";
import ProgressStep from "@/components/onboarding/progress-step";

export type OnboardingData = {
  username: string;
  gender: string;
  birthday: string;
  height: string;
  weight: string;
  bodyType: string;
  goals: string[];
  progress: Record<string, number>;
  photos: File[];
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    username: "",
    gender: "",
    birthday: "",
    height: "",
    weight: "",
    bodyType: "",
    goals: [],
    progress: {},
    photos: [],
  });

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToLogin = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={currentStep > 1 ? prevStep : goToLogin}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          
          {/* Progress Indicator */}
          <div className="flex space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-primary-300' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {currentStep === 1 && (
            <ProfileStep 
              data={data} 
              updateData={updateData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <GoalsStep 
              data={data} 
              updateData={updateData}
              onNext={nextStep}
            />
          )}
          {currentStep === 3 && (
            <ProgressStep 
              data={data} 
              updateData={updateData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
