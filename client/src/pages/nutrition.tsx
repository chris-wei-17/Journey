import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { NutritionChart } from "@/components/ui/nutrition-chart";

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
    <div className="app-gradient-bg">
      <Header 
        title="Nutrition"
        showBackButton={false}
        showHomeButton={true}
        onBack={handleBack}
      />
      
      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Enhanced Nutrition Chart */}
          <NutritionChart />

          {/* Nutrition Categories */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-fire text-orange-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Calories</p>
                {/* <p className="text-xl font-bold text-gray-800">Coming Soon</p> */}
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-drumstick-bite text-red-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Protein</p>
                {/* <p className="text-xl font-bold text-gray-800">Coming Soon</p> */}
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-bread-slice text-yellow-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Carbs</p>
                {/* <p className="text-xl font-bold text-gray-800">Coming Soon</p> */}
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-tint text-blue-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Hydration</p>
                {/* <p className="text-xl font-bold text-gray-800">Coming Soon</p> */}
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