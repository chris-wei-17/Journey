import { useEffect, useState } from "react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function WhoopDebug() {
  const [, setLocation] = useLocation();
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  const loadStatus = async () => {
    try {
      const s = await apiRequest("GET", "/api/whoop/status");
      setStatus(s);
    } catch (e: any) {
      setStatus({ error: e?.message || String(e) });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const testApi = async () => {
    setLoading(true);
    setOutput("");
    try {
      const res = await apiRequest("GET", "/api/whoop/test-body");
      setOutput(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOutput(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await apiRequest("POST", "/api/whoop/disconnect");
      await loadStatus();
      setOutput("Disconnected. Reconnect via Integrations (will re-consent for new scopes).");
    } catch (e: any) {
      setOutput(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-gradient-bg">
      <Header 
        title="WHOOP API Debug"
        showBackButton={true}
        onBack={handleBack}
        showHomeButton={true}
      />

      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-3xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0 mb-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Button variant="outline" onClick={loadStatus}>Refresh Status</Button>
              <Button variant="destructive" onClick={disconnect} disabled={loading}>Disconnect</Button>
            </div>
            <pre className="bg-gray-900 text-green-200 text-sm p-3 rounded-lg overflow-auto whitespace-pre-wrap break-all">
{JSON.stringify(status ?? { loading: true }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Test WHOOP API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Button onClick={testApi} disabled={loading}>
                {loading ? "Testing..." : "Test API"}
              </Button>
            </div>
            <pre className="bg-gray-900 text-green-200 text-sm p-3 rounded-lg overflow-auto max-h-[50vh] whitespace-pre-wrap break-all">
{output || "Click Test API to fetch body measurements."}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}