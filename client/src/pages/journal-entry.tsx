
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAccess } from "@/components/ui/quick-access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  getCurrentLocalDate, 
  getCurrentLocalDateTime, 
  initializeTimezone,
  formatInUserTimezone,
  getDateRangeForQuery,
  localDateToUtc
} from "@/lib/timezone-utils";

interface JournalEntry {
  id: number;
  content: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export default function JournalEntry() {
  const [, setLocation] = useLocation();
  const [journalText, setJournalText] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize timezone on component mount
  useEffect(() => {
    initializeTimezone();
  }, []);

  // Get date for journal entry - from URL param or current local date
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const dateString = dateParam || getCurrentLocalDate(); // YYYY-MM-DD format
  const today = getCurrentLocalDateTime();

  // Local storage key for caching
  const CACHE_KEY = `journal_entry_${dateString}`;

  // Fetch journal entry for today
  const { data: journalEntry, isLoading, error } = useQuery({
    queryKey: ['/api/journal-entries/date', dateString],
    queryFn: async () => {
      try {
        // Convert local date to UTC for server query
        const localDate = localDateToUtc(dateString);
        const response = await apiRequest('GET', `/api/journal-entries/date/${localDate.toISOString()}`);
        return response;
      } catch (error: any) {
        // If no entry exists, return null
        if (error.status === 404 || error.status === 500) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (no entry found)
      if (error?.status === 404) return false;
      return failureCount < 2;
    }
  });

  // Load from cache on component mount
  useEffect(() => {
    const cachedEntry = localStorage.getItem(CACHE_KEY);
    if (cachedEntry && !journalEntry && !isLoading) {
      try {
        const parsed = JSON.parse(cachedEntry);
        setJournalText(parsed.content || "");
        setOriginalText(parsed.content || "");
        console.log("📱 Loaded journal entry from cache");
      } catch (e) {
        console.error("Error parsing cached journal entry:", e);
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, [CACHE_KEY, journalEntry, isLoading]);

  // Update state when journal entry is loaded from server
  useEffect(() => {
    if (journalEntry) {
      setJournalText(journalEntry.content || "");
      setOriginalText(journalEntry.content || "");
      
      // Update cache with server data
      localStorage.setItem(CACHE_KEY, JSON.stringify(journalEntry));
      console.log("📱 Updated cache with server data");
    }
  }, [journalEntry, CACHE_KEY]);

  // Track changes and update cache
  useEffect(() => {
    setHasChanges(journalText.trim() !== originalText.trim());
    
    // Update cache with current content if there are changes
    if (journalText !== originalText) {
      const cacheData = {
        content: journalText,
        date: dateString,
        lastModified: new Date().toISOString(),
        isDraft: true
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("📱 Updated cache with draft content");
    }
  }, [journalText, originalText, CACHE_KEY, dateString]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      // Convert local date to UTC for proper server storage
      const localDate = localDateToUtc(dateString);
      return await apiRequest('POST', '/api/journal-entries', {
        content,
        date: localDate.toISOString()
      });
    },
    onSuccess: (data) => {
      setOriginalText(journalText);
      setHasChanges(false);
      
      // Update cache with saved data
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      
      // Update journal history cache with the new/updated entry
      const historyCache = localStorage.getItem('journal_previews_cache');
      if (historyCache) {
        try {
          const parsedCache = JSON.parse(historyCache);
          const preview = journalText.split(' ').slice(0, 20).join(' ') + (journalText.split(' ').length > 20 ? '...' : '');
          parsedCache[dateString] = {
            preview,
            updated_at: data.updated_at
          };
          localStorage.setItem('journal_previews_cache', JSON.stringify(parsedCache));
          console.log("📱 Updated journal history cache");
        } catch (e) {
          console.error("Error updating journal history cache:", e);
        }
      }
      
      // Invalidate and refetch - invalidate both individual entry and journal history
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries/date', dateString] });
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      
      toast({
        title: "Success",
        description: "Journal entry saved successfully!",
      });
      
      console.log("✅ Journal entry saved to database");
    },
    onError: (error: any) => {
      console.error("❌ Error saving journal entry:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  const handleSave = () => {
    if (!journalText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content before saving.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(journalText);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournalText(e.target.value);
  };

  // Clear cache function (for testing/debugging)
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    toast({
      title: "Cache cleared",
      description: "Local cache has been cleared.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
      <Header 
        title="Journal"
        showBackButton={false}
        showHomeButton={true}
        onBack={handleBack}
      />
      
      <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
        <div className="space-y-2">
          <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Entry - {formatInUserTimezone(dateString + 'T00:00:00', 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {hasChanges && (
                    <span className="text-sm text-orange-600 font-medium">
                      Unsaved changes
                    </span>
                  )}
                  {isLoading && (
                    <span className="text-sm text-blue-600 font-medium">
                      Loading...
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea 
                  value={journalText}
                  onChange={handleTextChange}
                  disabled={isLoading || saveMutation.isPending}
                  style={{
                    border: "2px solid black", 
                    width: "100%", 
                    height: "50vh", 
                    resize: "vertical", 
                    backgroundColor: "transparent",
                    padding: "12px",
                    borderRadius: "8px"
                  }} 
                  placeholder={isLoading ? "Loading your journal entry..." : "What's on your mind today?"}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-normal text-gray-800"
                />
                
                {/* Save Button */}
                <Button 
                  onClick={handleSave}
                  disabled={!journalText.trim() || !hasChanges || saveMutation.isPending}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveMutation.isPending ? 'SAVING...' : 'SAVE'}
                </Button>
                
                {/* Status Information */}
                <div className="text-xs text-gray-500 text-center space-y-1">
                  {journalEntry && (
                    <div>
                      Last updated: {formatInUserTimezone(journalEntry.updated_at, 'PPP p')}
                    </div>
                  )}
                  {error && (
                    <div className="text-red-500">
                      Error loading entry (using cached version)
                    </div>
                  )}
                  <div className="text-gray-400">
                    Changes are automatically saved locally as you type
                  </div>
                </div>
                
                {/* Debug Info - Remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded">
                    <div>Date: {dateString}</div>
                    <div>Has Changes: {hasChanges ? 'Yes' : 'No'}</div>
                    <div>Character Count: {journalText.length}</div>
                    <Button 
                      onClick={clearCache}
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                    >
                      Clear Cache
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Access - Keep this at the bottom */}
          <QuickAccess />
        </div>
      </div>
    </div>
  );
}