import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";

export default function Progress() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

    return (
    <>
      <Header 
        title="Progress" 
        showBackButton={false}
        onBack={handleBack}
        showHomeButton={true}
      />
      <div className="app-gradient-bg">
        <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Progress Chart */}
          <DataChart 
            title="Progress Tracking"
            data={[
              { date: '2024-01-01', value: 75 },
              { date: '2024-01-02', value: 78 },
              { date: '2024-01-03', value: 82 },
              { date: '2024-01-04', value: 80 },
              { date: '2024-01-05', value: 85 },
              { date: '2024-01-06', value: 88 },
              { date: '2024-01-07', value: 90 },
            ]}
            lineColor="#3b82f6"
            backgroundColor="rgba(59, 130, 246, 0.1)"
            yAxisLabel="Progress Score"
          />

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-trophy text-yellow-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-fire text-red-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access */}
          <QuickAccess />
        </div>
        </main>
      </div>
    </>
  );
}