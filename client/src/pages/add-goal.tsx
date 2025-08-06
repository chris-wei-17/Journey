import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/ui/header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Predefined goal types
const DEFAULT_GOAL_TYPES = [
  {
    id: 'sleep',
    label: 'Sleep',
    icon: 'fa-bed',
    color: 'text-purple-500',
    description: 'Track your daily sleep duration',
    primaryUnit: 'hours',
    secondaryUnit: 'minutes',
    placeholder: { primary: '8', secondary: '30' }
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: 'fa-utensils',
    color: 'text-green-500',
    description: 'Track your daily calorie intake',
    primaryUnit: 'calories',
    secondaryUnit: null,
    placeholder: { primary: '2000', secondary: null }
  },
  {
    id: 'daily_move',
    label: 'Daily Move',
    icon: 'fa-running',
    color: 'text-blue-500',
    description: 'Track your daily movement/exercise time',
    primaryUnit: 'hours',
    secondaryUnit: 'minutes',
    placeholder: { primary: '1', secondary: '30' }
  }
];

const goalSchema = z.object({
  goalType: z.string().min(1, "Please select a goal type"),
  goalName: z.string().min(1, "Goal name is required"),
  targetValuePrimary: z.string().min(1, "Target value is required"),
  targetValueSecondary: z.string().optional(),
  customGoalType: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function AddGoal() {
  const [, setLocation] = useLocation();
  const [selectedGoalType, setSelectedGoalType] = useState<string>("");
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goalType: "",
      goalName: "",
      targetValuePrimary: "",
      targetValueSecondary: "",
      customGoalType: "",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return apiRequest("POST", "/api/goals", goalData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setLocation("/goals");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/goals");
    }
  };

  const handleGoalTypeSelect = (goalType: string) => {
    if (goalType === 'custom') {
      setIsCustomGoal(true);
      setSelectedGoalType('custom');
      form.setValue('goalType', 'custom');
      form.setValue('goalName', '');
    } else {
      setIsCustomGoal(false);
      setSelectedGoalType(goalType);
      form.setValue('goalType', goalType);
      
      const selectedGoal = DEFAULT_GOAL_TYPES.find(g => g.id === goalType);
      if (selectedGoal) {
        form.setValue('goalName', selectedGoal.label + ' Goal');
        form.setValue('targetValuePrimary', selectedGoal.placeholder.primary);
        form.setValue('targetValueSecondary', selectedGoal.placeholder.secondary || '');
      }
    }
  };

  const onSubmit = (data: GoalFormData) => {
    const selectedGoal = DEFAULT_GOAL_TYPES.find(g => g.id === data.goalType);
    const finalGoalType = isCustomGoal ? (data.customGoalType || 'custom') : data.goalType;
    
    const goalData = {
      goalType: finalGoalType,
      goalName: data.goalName,
      targetValuePrimary: parseFloat(data.targetValuePrimary),
      targetUnitPrimary: selectedGoal?.primaryUnit || 'units',
      targetValueSecondary: data.targetValueSecondary ? parseFloat(data.targetValueSecondary) : null,
      targetUnitSecondary: selectedGoal?.secondaryUnit || null,
    };

    createGoalMutation.mutate(goalData);
  };

  const selectedGoalConfig = DEFAULT_GOAL_TYPES.find(g => g.id === selectedGoalType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
      <Header 
        title="Add Goal"
        showBackButton={true}
        onBack={handleBack}
      />
      
      <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
        <div className="space-y-6">
          {/* Goal Type Selection */}
          {!selectedGoalType && (
            <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Choose Goal Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Predefined Goals */}
                <div className="space-y-3">
                  {DEFAULT_GOAL_TYPES.map((goalType) => (
                    <div key={goalType.id}>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-auto p-4 text-left"
                        onClick={() => handleGoalTypeSelect(goalType.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <i className={`fas ${goalType.icon} ${goalType.color} text-xl`}></i>
                          <div>
                            <div className="font-medium text-gray-900">{goalType.label}</div>
                            <div className="text-sm text-gray-500">{goalType.description}</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Custom Goal Option */}
                <div className="border-t pt-4 mt-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => handleGoalTypeSelect('custom')}
                  >
                    <div className="flex items-center space-x-4">
                      <i className="fas fa-plus text-gray-500 text-xl"></i>
                      <div>
                        <div className="font-medium text-gray-900">Custom Goal</div>
                        <div className="text-sm text-gray-500">Create your own goal type</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goal Configuration Form */}
          {selectedGoalType && (
            <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  {selectedGoalConfig && (
                    <i className={`fas ${selectedGoalConfig.icon} ${selectedGoalConfig.color} mr-3`}></i>
                  )}
                  {isCustomGoal ? 'Custom Goal' : selectedGoalConfig?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setSelectedGoalType('');
                      setIsCustomGoal(false);
                      form.reset();
                    }}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Custom Goal Type */}
                    {isCustomGoal && (
                      <FormField
                        control={form.control}
                        name="customGoalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Category</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., water_intake, steps, meditation"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Goal Name */}
                    <FormField
                      control={form.control}
                      name="goalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter a name for this goal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Primary Target Value */}
                    <FormField
                      control={form.control}
                      name="targetValuePrimary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Target {selectedGoalConfig?.primaryUnit || 'Value'}
                            {selectedGoalConfig?.primaryUnit && (
                              <span className="text-gray-500 text-sm ml-1">
                                ({selectedGoalConfig.primaryUnit})
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder={selectedGoalConfig?.placeholder.primary || "0"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Secondary Target Value (for time-based goals) */}
                    {selectedGoalConfig?.secondaryUnit && (
                      <FormField
                        control={form.control}
                        name="targetValueSecondary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Additional {selectedGoalConfig.secondaryUnit}
                              <span className="text-gray-500 text-sm ml-1">
                                ({selectedGoalConfig.secondaryUnit}) - optional
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                max="59"
                                placeholder={selectedGoalConfig?.placeholder.secondary || "0"}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createGoalMutation.isPending}
                    >
                      {createGoalMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Creating Goal...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus mr-2"></i>
                          Create Goal
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}