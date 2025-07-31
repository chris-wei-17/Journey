
import React from "react";
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
        title="Journal" // Change this to your page title
        showBackButton={false}
        showHomeButton={true}
        onBack={handleBack}
      />
      
      <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
        <div className="space-y-2">
          <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Entry
                </CardTitle>
              </div>
            </CardHeader>
              <CardContent>
                <div>
                  <textarea 
                    style={{border: "2px solid black", width: "100%", height: "100px", resize: "vertical", backgroundColor: "transparent"}} 
                    placeholder="Enter text here..."
                  />
                </div>
              </CardContent>
          </Card>


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