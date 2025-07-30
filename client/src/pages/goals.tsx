import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface GoalTarget {
  id: number;
  goalType: string;
  goalName: string;
  targetValuePrimary: number;
  targetUnitPrimary: string;
  targetValueSecondary?: number;
  targetUnitSecondary?: string;
  isActive: boolean;
  createdAt: string;
}

export default function Goals() {
  const [, setLocation] = useLocation();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["/api/goals"],
    queryFn: () => apiRequest("GET", "/api/goals"),
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  const formatGoalValue = (goal: GoalTarget) => {
    if (goal.targetValueSecondary && goal.targetUnitSecondary) {
      return `${goal.targetValuePrimary} ${goal.targetUnitPrimary} ${goal.targetValueSecondary} ${goal.targetUnitSecondary}`;
    }
    return `${goal.targetValuePrimary} ${goal.targetUnitPrimary}`;
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'sleep': return 'fa-bed';
      case 'nutrition': return 'fa-utensils';
      case 'daily_move': return 'fa-running';
      default: return 'fa-bullseye';
    }
  };

  const getGoalColor = (goalType: string) => {
    switch (goalType) {
      case 'sleep': return 'text-purple-500';
      case 'nutrition': return 'text-green-500';
      case 'daily_move': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
      <Header 
        title="Goals"
        showBackButton={false}
        onBack={handleBack}
      />
      
              <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
        <div className="space-y-6">
          {/* Add Goal Button */}
          <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-4">
              <Button
                onClick={() => setLocation('/add-goal')}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg h-14"
              >
                <i className="fas fa-plus mr-3 text-lg"></i>
                <span className="text-lg font-medium">Add New Goal</span>
              </Button>
            </CardContent>
          </Card>

          {/* Goals List */}
          {isLoading ? (
            <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading goals...</p>
              </CardContent>
            </Card>
          ) : goals.length > 0 ? (
            <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <i className="fas fa-bullseye text-green-500 mr-3"></i>
                  Your Goals ({goals.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.map((goal: GoalTarget) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center`}>
                        <i className={`fas ${getGoalIcon(goal.goalType)} ${getGoalColor(goal.goalType)} text-xl`}></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{goal.goalName}</h4>
                        <p className="text-sm text-gray-600 capitalize">{goal.goalType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatGoalValue(goal)}</p>
                      <p className="text-sm text-gray-500">Target</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
              <CardContent>
                <div className="text-center py-16">
                  <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                    <i className="fas fa-bullseye text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No Goals Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create your first goal to start tracking your progress and staying motivated.
                    </p>
                    <Button
                      onClick={() => setLocation('/add-goal')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Goal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Access */}
          <QuickAccess />
        </div>
      </div>
    </div>
  );
}