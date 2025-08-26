import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Integrations() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  const handleWhoopConnect = () => {
    window.location.href = "/api/whoop/auth";
  };

  return (
    <div className="app-gradient-bg">
      <Header 
        title="Integrations"
        showBackButton={true}
        onBack={handleBack}
        showHomeButton={true}
      />

      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-3xl mx-auto">
        <div className="space-y-6">
          <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0" style={{
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i className="fas fa-plug"></i>
                Available Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/80">
                <div>
                  <div className="text-base font-medium text-gray-800">WHOOP</div>
                  <div className="text-sm text-gray-600">Connect your WHOOP account to sync recovery, sleep, and workout data.</div>
                </div>
                <Button onClick={handleWhoopConnect} className="shadow-md">
                  <i className="fas fa-link mr-2"></i>
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}