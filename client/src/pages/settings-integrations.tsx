import { useState } from "react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsIntegrations() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<any>(null);

  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiRequest('POST', '/api/health/apple/upload', fd);
    setStatus(res);
  };

  const fetchStatus = async () => {
    const res = await apiRequest('GET', '/api/health/apple/status');
    setStatus(res);
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      <Header title="Integrations" showHomeButton />
      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-3xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-sm border-0">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">Apple Health</h2>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="flex gap-2 mt-2">
              <Button onClick={upload} disabled={!file} className="bg-blue-600 text-white">Upload Export</Button>
              <Button onClick={fetchStatus} variant="outline">Check Status</Button>
            </div>
            <pre className="text-xs mt-4 bg-gray-100 p-2 rounded">{status ? JSON.stringify(status, null, 2) : 'No status yet'}</pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}