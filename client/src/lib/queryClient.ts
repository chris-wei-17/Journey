import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Function to get the correct API base URL
function getApiBaseUrl(): string {
  // Check if we're in development mode (Vite dev server)
  if (import.meta.env.DEV) {
    return '';  // Vite will proxy to the backend
  }
  
  // In production, use current origin (works for both Vercel and other deployments)
  return window.location.origin;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const token = localStorage.getItem('authToken');
  
  const headers: Record<string, string> = {};
  
  // Handle FormData differently from JSON
  let body: string | FormData | undefined;
  if (data instanceof FormData) {
    body = data;
    // Don't set Content-Type for FormData, let browser set it with boundary
  } else if (data) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }
  
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  // Construct the full URL
  const baseUrl = getApiBaseUrl();
  const apiUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  console.log('API Request:', method, apiUrl);
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    console.error('API Error:', res.status, text);
    
    // Handle unauthorized responses
    if (res.status === 401) {
      localStorage.removeItem('authToken');
      // Don't redirect if already on auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.reload();
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  
  const contentType = res.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  
  return res.text();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('authToken');
    
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    // Construct the full URL
    const baseUrl = getApiBaseUrl();
    const queryUrl = queryKey.join("/") as string;
    const apiUrl = queryUrl.startsWith('http') ? queryUrl : `${baseUrl}${queryUrl}`;
    
    console.log('Query Request:', apiUrl);
    
    const res = await fetch(apiUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      localStorage.removeItem('authToken');
      return null;
    }

    if (res.status === 401) {
      localStorage.removeItem('authToken');
      // Don't redirect if already on auth page  
      if (!window.location.pathname.includes('/auth')) {
        window.location.reload();
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
