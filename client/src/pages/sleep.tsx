import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";

export default function Sleep() {
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
        title="Sleep"
        showBackButton={false}
        onBack={handleBack}
      />
      
              <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
        <div className="space-y-6">
          {/* Sleep Chart */}
          <DataChart 
            title="Sleep Hours"
            data={[
              { date: '2024-01-01', value: 7.5 },
              { date: '2024-01-02', value: 8.2 },
              { date: '2024-01-03', value: 6.8 },
              { date: '2024-01-04', value: 7.9 },
              { date: '2024-01-05', value: 8.1 },
              { date: '2024-01-06', value: 7.3 },
              { date: '2024-01-07', value: 8.5 },
            ]}
            lineColor="#6366f1"
            backgroundColor="rgba(99, 102, 241, 0.1)"
            yAxisLabel="Hours"
          />

          {/* Sleep Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-clock text-blue-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-star text-yellow-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Quality</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-bed text-purple-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Bedtime</p>
                <p className="text-xl font-bold text-gray-800">Coming Soon</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-sun text-orange-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Wake Time</p>
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