import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";

export default function Template() {
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
        title="Template Page" // Change this to your page title
        showBackButton={false}
        onBack={handleBack}
      />
      
      <div className="pt-[calc(env(safe-area-inset-top)+5rem)] px-4 pb-6">
        <div className="space-y-6">
          {/* Main Chart */}
          <DataChart 
            title="Template Chart" // Change this to your chart title
            data={[
              { date: '2024-01-01', value: 10 },
              { date: '2024-01-02', value: 15 },
              { date: '2024-01-03', value: 8 },
              { date: '2024-01-04', value: 22 },
              { date: '2024-01-05', value: 18 },
              { date: '2024-01-06', value: 12 },
              { date: '2024-01-07', value: 25 },
            ]}
            lineColor="#6366f1" // Change this to your preferred color
            backgroundColor="rgba(99, 102, 241, 0.1)" // Change this to match your line color
            yAxisLabel="Units" // Change this to your Y-axis label
          />

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-chart-line text-blue-500 text-2xl mb-2"></i> {/* Change icon and color */}
                <p className="text-sm text-gray-600">Metric 1</p> {/* Change metric name */}
                <p className="text-xl font-bold text-gray-800">Coming Soon</p> {/* Replace with actual data */}
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-trophy text-yellow-500 text-2xl mb-2"></i> {/* Change icon and color */}
                <p className="text-sm text-gray-600">Metric 2</p> {/* Change metric name */}
                <p className="text-xl font-bold text-gray-800">Coming Soon</p> {/* Replace with actual data */}
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-target text-green-500 text-2xl mb-2"></i> {/* Change icon and color */}
                <p className="text-sm text-gray-600">Metric 3</p> {/* Change metric name */}
                <p className="text-xl font-bold text-gray-800">Coming Soon</p> {/* Replace with actual data */}
              </CardContent>
            </Card>
            
            <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-4 text-center">
                <i className="fas fa-calendar text-purple-500 text-2xl mb-2"></i> {/* Change icon and color */}
                <p className="text-sm text-gray-600">Metric 4</p> {/* Change metric name */}
                <p className="text-xl font-bold text-gray-800">Coming Soon</p> {/* Replace with actual data */}
              </CardContent>
            </Card>
          </div>

          {/* Optional: Additional Content Section */}
          {/* 
          <Card className="bg-white/75 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle>Additional Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Add any additional content here...</p>
            </CardContent>
          </Card>
          */}

          {/* Quick Access - Keep this at the bottom */}
          <QuickAccess />
        </div>
      </div>
    </div>
  );
}

/*
TEMPLATE CUSTOMIZATION GUIDE:
============================

1. RENAME THE FILE:
   - Copy this file to your new page name (e.g., `habits.tsx`)
   - Update the export default function name to match

2. UPDATE THE TITLE:
   - Line 22: Change "Template Page" to your page title

3. CUSTOMIZE THE CHART:
   - Line 29: Change chart title
   - Lines 30-37: Replace with your actual data
   - Line 39: Change line color (hex color code)
   - Line 40: Change background color (rgba with transparency)
   - Line 41: Change Y-axis label

4. UPDATE METRICS:
   - For each metric card (4 total):
     - Change the FontAwesome icon class (fas fa-icon-name)
     - Change the icon color (text-color-500)
     - Change the metric name
     - Replace "Coming Soon" with actual data when ready

5. ADD TO ROUTING:
   - Add import in App.tsx: import YourPage from "@/pages/your-page";
   - Add route in App.tsx: <Route path="/your-route" component={YourPage} />

6. OPTIONAL CUSTOMIZATIONS:
   - Uncomment and modify the "Additional Content Section" if needed
   - Adjust the grid layout (change grid-cols-2 to grid-cols-3, etc.)
   - Add navigation to specific features
   - Integrate with your data APIs
*/