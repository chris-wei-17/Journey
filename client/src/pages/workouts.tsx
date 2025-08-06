import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";

export default function Workouts() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="app-gradient-bg">
      <Header 
        title="Workouts"
        showBackButton={false}
        showHomeButton={true}
        onBack={handleBack}
      />
      
      <main className="pt-[calc(env(safe-area-inset-top)+5rem)] p-4 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Workout Chart */}
          <DataChart 
            title="Workout Intensity"
            data={[
              { date: '2024-01-01', value: 6 },
              { date: '2024-01-02', value: 8 },
              { date: '2024-01-03', value: 7 },
              { date: '2024-01-04', value: 9 },
              { date: '2024-01-05', value: 6 },
              { date: '2024-01-06', value: 8 },
              { date: '2024-01-07', value: 7 },
            ]}
            lineColor="#8b5cf6"
            backgroundColor="rgba(139, 92, 246, 0.1)"
            yAxisLabel="Intensity (1-10)"
          />

          {/* Workout Categories */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-fist-raised text-red-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Strength</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-heartbeat text-red-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Cardio</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-leaf text-green-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Flexibility</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-stopwatch text-blue-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">HIIT</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access */}
          <QuickAccess />
        </div>
      </main>
    </div>
  );
}