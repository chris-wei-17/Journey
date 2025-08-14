import { useQuery } from "@tanstack/react-query";
import { UserWithProfile } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery<UserWithProfile>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
