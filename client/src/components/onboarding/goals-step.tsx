import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingData } from "@/pages/onboarding";

const GOALS = [
  { id: "general-fitness", label: "General Fitness", icon: "fas fa-running" },
  { id: "cardio", label: "Cardio", icon: "fas fa-heartbeat" },
  { id: "strength", label: "Strength", icon: "fas fa-dumbbell" },
  { id: "muscle-mass", label: "Muscle Mass", icon: "fas fa-fist-raised" },
  { id: "weight-loss", label: "Weight Loss", icon: "fas fa-weight" },
  { id: "improve-diet", label: "Improve Diet", icon: "fas fa-apple-alt" },
];

interface GoalsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function GoalsStep({ data, updateData, onNext }: GoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals);

  useEffect(() => {
    updateData({ goals: selectedGoals });
  }, [selectedGoals, updateData]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    if (selectedGoals.length === 0) {
      return;
    }
    onNext();
  };

  return (
    <Card className="card-shadow slide-in">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">What Are Your Goals?</h2>
        <p className="text-gray-600 text-center mb-8">Select all that apply to personalize your experience</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-4 border-2 rounded-xl text-center transition-all duration-300 ${
                selectedGoals.includes(goal.id)
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <i className={`${goal.icon} text-2xl text-primary-300 mb-2`}></i>
              <p className="text-sm font-medium text-gray-700">{goal.label}</p>
            </button>
          ))}
        </div>

        <Button 
          onClick={handleNext}
          disabled={selectedGoals.length === 0}
          className="w-full bg-gradient-to-r from-primary-300 to-lavender-300 hover:from-primary-400 hover:to-lavender-400 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-center"
        >
          Continue
        </Button>

        {selectedGoals.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Please select at least one goal to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}
