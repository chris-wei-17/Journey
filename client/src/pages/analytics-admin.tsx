import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function AnalyticsAdmin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [testUserId, setTestUserId] = useState(0);
  const [log, setLog] = useState<string>("");
  const [runResult, setRunResult] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");

  const allowed = isAuthenticated && (user?.username?.toLowerCase?.() === 'chris');

  useEffect(() => {
    if (!allowed) setStatus('Access denied. Admin only.');
  }, [allowed]);

  const runPipeline = async () => {
    setStatus('Running...');
    try {
      const res = await apiRequest('POST', `/api/run_pipeline?user_id=${encodeURIComponent(String(testUserId || ''))}`);
      setRunResult(res);
      setLog(res.log || '');
      setBatchId(res.batchId || '');
      setStatus(res.status || 'done');
    } catch (e: any) {
      setStatus('Error: ' + (e?.message || 'unknown'));
    }
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      <Header title="Analytics Admin" showHomeButton />
      <main className="pt-[calc(env(safe-area-inset-top)+6rem)] p-4 max-w-6xl mx-auto">
        {!allowed ? (
          <Card className="bg-white/75 border-0"><CardContent className="p-4">{status}</CardContent></Card>
        ) : (
          <div className="space-y-4">
            <Card className="bg-white/75 border-0">
              <CardContent className="p-4">
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-sm text-gray-600">Test user_id</label>
                    <input type="number" className="border rounded px-2 py-1" value={testUserId} onChange={(e) => setTestUserId(parseInt(e.target.value || '0'))} />
                  </div>
                  <Button onClick={runPipeline} className="bg-blue-600 text-white">Run Pipeline</Button>
                  {batchId && <span className="text-sm text-gray-600">Batch: {batchId}</span>}
                </div>
                <div className="mt-2 text-sm text-gray-500">{status}</div>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded max-h-64 overflow-auto">{log}</pre>
              </CardContent>
            </Card>

            <Card className="bg-white/75 border-0">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Data Products</h3>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li>analytics_runs (Supabase)</li>
                  <li>analytics_summary (Supabase)</li>
                  <li>analytics_relationships (Supabase)</li>
                  <li>Supabase Storage (if configured): analytics/&lt;batch_id&gt;/metrics/</li>
                </ul>
                <div className="mt-2 text-xs text-gray-500">Use Supabase SQL editor or REST to browse tables; artifacts uploaded to Storage if configured.</div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}