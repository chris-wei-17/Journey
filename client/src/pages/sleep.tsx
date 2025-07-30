import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";
import { apiRequest } from "@/lib/queryClient";

export default function Sleep() {
  const [, setLocation] = useLocation();

  // Fetch sleep chart data
  const { data: sleepData = [], isLoading: sleepLoading, error: sleepError } = useQuery({
    queryKey: ["/api/activities/sleep/chart"],
    queryFn: () => apiRequest("GET", "/api/activities/sleep/chart"),
  });

  // Calculate sleep statistics
  const sleepStats = React.useMemo(() => {
    if (!sleepData.length) return { avgSleep: 0, lastNight: 0, weekTotal: 0, daysWithData: 0 };
    
    // Since we now only get data points for days with actual sleep, all values are valid
    const values = sleepData.map((d: any) => d.value);
    const avgSleep = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
    const lastNight = sleepData[sleepData.length - 1]?.value || 0;
    const weekTotal = values.reduce((a: number, b: number) => a + b, 0);
    const daysWithData = values.length;
    
    return { avgSleep, lastNight, weekTotal, daysWithData };
  }, [sleepData]);

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
            data={sleepLoading ? [] : sleepData}
            lineColor="#6366f1"
            backgroundColor="rgba(99, 102, 241, 0.1)"
            yAxisLabel="Hours"
          />

          {/* Sleep Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-clock text-blue-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Last Night</p>
                <p className="text-xl font-bold text-gray-800">
                  {sleepLoading ? "..." : sleepStats.lastNight > 0 ? `${sleepStats.lastNight.toFixed(1)}h` : "--"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-chart-line text-green-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Weekly Avg</p>
                <p className="text-xl font-bold text-gray-800">
                  {sleepLoading ? "..." : sleepStats.avgSleep > 0 ? `${sleepStats.avgSleep.toFixed(1)}h` : "--"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-calendar-week text-purple-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Week Total</p>
                <p className="text-xl font-bold text-gray-800">
                  {sleepLoading ? "..." : sleepStats.weekTotal > 0 ? `${sleepStats.weekTotal.toFixed(1)}h` : "--"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-target text-orange-500 text-2xl mb-2"></i>
                <p className="text-sm text-gray-600">Sleep Goal</p>
                <p className="text-xl font-bold text-gray-800">8.0h</p>
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