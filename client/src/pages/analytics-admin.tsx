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
  const [summaryCount, setSummaryCount] = useState<number>(0);
  const [relationshipsCount, setRelationshipsCount] = useState<number>(0);
  const [storagePrefix, setStoragePrefix] = useState<string>("");
  const [summaryRows, setSummaryRows] = useState<any[]>([]);
  const [relRows, setRelRows] = useState<any[]>([]);
  const [storageKeys, setStorageKeys] = useState<string[]>([]);

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

  const refreshOutputs = async () => {
    try {
      const s = await apiRequest('GET', '/api/analytics/summary/count');
      setSummaryCount(s.count || 0);
    } catch {}
    try {
      const r = await apiRequest('GET', '/api/analytics/relationships/count');
      setRelationshipsCount(r.count || 0);
    } catch {}
    try {
      const p = await apiRequest('GET', '/api/analytics/storage-prefix');
      setStoragePrefix(p.prefix || '');
    } catch {}
    try {
      const sr = await apiRequest('GET', '/api/analytics/summary/sample?limit=10');
      setSummaryRows(sr.rows || []);
    } catch {}
    try {
      const rr = await apiRequest('GET', '/api/analytics/relationships/sample?limit=10');
      setRelRows(rr.rows || []);
    } catch {}
    try {
      const latest = await apiRequest('GET', '/api/analytics/runs/latest');
      const bid = latest.batchId || batchId;
      if (bid) {
        const ks = await apiRequest('GET', `/api/analytics/storage/list?batchId=${encodeURIComponent(bid)}`);
        setStorageKeys(ks.keys || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (allowed) refreshOutputs();
  }, [allowed]);

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
                  <Button onClick={refreshOutputs} variant="outline">Refresh Outputs</Button>
                </div>
                <div className="mt-2 text-sm text-gray-500">{status}</div>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded max-h-64 overflow-auto">{log}</pre>
              </CardContent>
            </Card>

            <Card className="bg-white/75 border-0">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Data Products</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="p-2 rounded bg-gray-50">
                    <div className="font-medium">analytics_summary</div>
                    <div>Rows: {summaryCount}</div>
                    <pre className="text-xs mt-2 bg-white p-2 rounded max-h-40 overflow-auto">{JSON.stringify(summaryRows, null, 2)}</pre>
                  </div>
                  <div className="p-2 rounded bg-gray-50">
                    <div className="font-medium">analytics_relationships</div>
                    <div>Rows: {relationshipsCount}</div>
                    <pre className="text-xs mt-2 bg-white p-2 rounded max-h-40 overflow-auto">{JSON.stringify(relRows, null, 2)}</pre>
                  </div>
                  <div className="p-2 rounded bg-gray-50 col-span-2">
                    <div className="font-medium">Storage prefix</div>
                    <div className="text-xs break-all">{storagePrefix || '(unset)'}</div>
                    <div className="mt-2 font-medium">Latest batch storage keys</div>
                    <ul className="text-xs list-disc pl-4 max-h-40 overflow-auto bg-white p-2 rounded">
                      {storageKeys.map(k => <li key={k}>{k}</li>)}
                      {storageKeys.length === 0 && <li>(none)</li>}
                    </ul>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">Use Supabase to browse tables; artifacts uploaded under the prefix shown.</div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}