import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { DataChart } from "@/components/ui/data-chart";

export default function Landing() {
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
        title="JOURNEY" // Change this to your page title
        showBackButton={false}
        onBack={handleBack}
      />
      <Card className="mb-2 bg-white/75 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">Blog Post Title Here</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4"/>
      </CardContent>
    </Card>
      
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
  );
}
