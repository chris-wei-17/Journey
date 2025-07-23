import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPhotos() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {},
      apiTests: {}
    };

    // Check localStorage
    try {
      info.localStorage.authToken = localStorage.getItem('authToken') ? 'Present' : 'Missing';
      info.localStorage.authTokenLength = localStorage.getItem('authToken')?.length || 0;
    } catch (e) {
      info.localStorage.error = e.message;
    }

    // Test API endpoints
    const endpoints = [
      '/api/photos',
      '/api/photos/test',
      '/api/auth/check'
    ];

    for (const endpoint of endpoints) {
      try {
        const token = localStorage.getItem('authToken');
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(endpoint, {
          headers,
          credentials: "include",
        });

        info.apiTests[endpoint] = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: response.ok ? await response.json() : await response.text()
        };
      } catch (e) {
        info.apiTests[endpoint] = {
          error: e.message
        };
      }
    }

    setDebugInfo(info);
    setLoading(false);
  };

  const testImageUrl = (url: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ success: true, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      img.onerror = () => resolve({ success: false, error: 'Failed to load' });
      img.src = url;
    });
  };

  const testImageUrls = async () => {
    if (!debugInfo.apiTests?.['/api/photos']?.body) return;
    
    const photos = debugInfo.apiTests['/api/photos'].body;
    if (!Array.isArray(photos) || photos.length === 0) return;

    const photo = photos[0];
    const tests: any = {};

    // Test signed URLs
    if (photo.thumbnailUrl) {
      tests.thumbnailUrl = await testImageUrl(photo.thumbnailUrl);
    }
    if (photo.imageUrl) {
      tests.imageUrl = await testImageUrl(photo.imageUrl);
    }

    // Test fallback URLs
    const token = localStorage.getItem('authToken');
    if (token) {
      const fallbackThumbnail = `/api/photos/${photo.filename}?thumbnail=true&token=${token}`;
      const fallbackImage = `/api/photos/${photo.filename}?token=${token}`;
      
      tests.fallbackThumbnail = await testImageUrl(fallbackThumbnail);
      tests.fallbackImage = await testImageUrl(fallbackImage);
    }

    setDebugInfo(prev => ({
      ...prev,
      imageTests: tests
    }));
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-300 to-lavender-300 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Photo Debug Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runDiagnostics}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
              </Button>
              <Button 
                onClick={testImageUrls}
                disabled={!debugInfo.apiTests?.['/api/photos']?.body}
                className="bg-green-600 hover:bg-green-700"
              >
                Test Image URLs
              </Button>
            </div>

            {Object.keys(debugInfo).length > 0 && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}