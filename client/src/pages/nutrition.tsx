import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";

export default function Nutrition() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
      <Header 
        title="Nutrition"
        showBackButton={false}
        onBack={handleBack}
      />
      
              <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
        <div className="space-y-6">
          {/* Nutrition Chart */}
          <DataChart 
            title="Daily Calories"
            data={[
              { date: '2024-01-01', value: 2200 },
              { date: '2024-01-02', value: 2350 },
              { date: '2024-01-03', value: 2100 },
              { date: '2024-01-04', value: 2400 },
              { date: '2024-01-05', value: 2150 },
              { date: '2024-01-06', value: 2300 },
              { date: '2024-01-07', value: 2250 },
            ]}
            lineColor="#10b981"
            backgroundColor="rgba(16, 185, 129, 0.1)"
            yAxisLabel="Calories"
          />

          {/* Nutrition Categories */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-fire text-orange-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Calories</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-drumstick-bite text-red-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Protein</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-bread-slice text-yellow-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Carbs</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-tint text-blue-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Hydration</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access */}
          <QuickAccess />
        </div>
      </div>
    </div>
  );
}