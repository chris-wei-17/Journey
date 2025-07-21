import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
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
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include", // This handles session-based auth
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Handle unauthorized responses
    if (res.status === 401) {
      // Redirect to login for Replit auth
      window.location.href = '/api/login';
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
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include", // This handles session-based auth
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      // Redirect to login for Replit auth
      window.location.href = '/api/login';
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
