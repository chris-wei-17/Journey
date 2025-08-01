import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { QuickAccess } from "@/components/ui/quick-access";
import { apiRequest } from "@/lib/queryClient";
import { initializeTimezone, formatInUserTimezone, utcToLocalDate, getUserTimezone } from "@/lib/timezone-utils";

interface JournalEntry {
  id: number;
  date: string;
  content: string;
  preview: string;
  created_at: string;
  updated_at: string;
}

interface JournalEntriesByDate {
  [date: string]: JournalEntry;
}

export default function JournalHistory() {
  const [, setLocation] = useLocation();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Initialize timezone on component mount
  useEffect(() => {
    initializeTimezone();
  }, []);

  // Local storage key for caching previews
  const CACHE_KEY = 'journal_previews_cache';

  // Fetch all journal entries
  const { data: allEntries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal-entries'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/journal-entries');
    },
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for more responsive updates)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to page
  });

  // Cache previews locally
  useEffect(() => {
    if (allEntries.length > 0) {
      const previewCache = allEntries.reduce((acc, entry) => {
        const dateKey = entry.date.split('T')[0]; // Get YYYY-MM-DD
        acc[dateKey] = {
          preview: entry.preview,
          updated_at: entry.updated_at
        };
        return acc;
      }, {} as Record<string, { preview: string; updated_at: string }>);
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(previewCache));
      console.log('📱 Cached journal previews for', Object.keys(previewCache).length, 'entries');
    }
  }, [allEntries, CACHE_KEY]);

  // Load cached previews on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && allEntries.length === 0) {
      try {
        const parsedCache = JSON.parse(cached);
        console.log('📱 Loaded cached previews for', Object.keys(parsedCache).length, 'entries');
      } catch (e) {
        console.error('Error loading cached previews:', e);
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, [CACHE_KEY, allEntries.length]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  const openJournalEntry = (date: string) => {
    const entryDate = date.split('T')[0]; // Get YYYY-MM-DD format
    setLocation(`/journal-entry?date=${entryDate}`);
  };

  // Group entries by date
  const entriesByDate: JournalEntriesByDate = allEntries.reduce((acc, entry) => {
    const dateKey = entry.date.split('T')[0]; // Get YYYY-MM-DD
    acc[dateKey] = entry;
    return acc;
  }, {} as JournalEntriesByDate);

  // Sort dates
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b).getTime() - new Date(a).getTime();
    } else {
      return new Date(a).getTime() - new Date(b).getTime();
    }
  });

  const formatDisplayDate = (dateStr: string): string => {
    try {
      return formatInUserTimezone(dateStr + 'T00:00:00', 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getWordCount = (content: string): number => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (content: string): number => {
    return content.length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
        <Header 
          title="Journal History"
          showBackButton={false}
          showHomeButton={true}
          onBack={handleBack}
        />
        <div className="flex items-center justify-center pt-[calc(env(safe-area-inset-top)+6rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
        <Header 
          title="Journal History"
          showBackButton={false}
          showHomeButton={true}
          onBack={handleBack}
        />
        
        <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
          {/* Sort Controls */}
          <div className="flex justify-end items-center mb-6">
            <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-lg">
              <Button
                variant={sortOrder === 'newest' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('newest')}
                className="rounded-r-none"
              >
                <i className="fas fa-arrow-down mr-2"></i>
                Newest
              </Button>
              <Button
                variant={sortOrder === 'oldest' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('oldest')}
                className="rounded-l-none border-l"
              >
                <i className="fas fa-arrow-up mr-2"></i>
                Oldest
              </Button>
            </div>
          </div>

          {/* Journal Entries */}
          {sortedDates.length > 0 ? (
            <div className="space-y-6">
              {sortedDates.map((dateStr) => {
                const entry = entriesByDate[dateStr];
                const wordCount = getWordCount(entry.content);
                const charCount = getCharacterCount(entry.content);
                
                // Debug logging for timezone issues
                console.log('🕐 Debug timezone for entry:', {
                  dateStr,
                  updated_at: entry.updated_at,
                  formatted_time: formatInUserTimezone(entry.updated_at, 'h:mm a'),
                  user_timezone: getUserTimezone(),
                  raw_date: new Date(entry.updated_at).toString()
                });

                return (
                  <div key={dateStr} className="space-y-3">
                    {/* Date Header - Right Aligned */}
                    <div className="flex justify-end items-center">
                      <div className="bg-white/75 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {formatDisplayDate(dateStr)}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {wordCount} words • {charCount} characters
                        </p>
                      </div>
                    </div>

                    {/* Journal Entry Card */}
                    <div 
                      className="bg-white/75 backdrop-blur-sm rounded-xl p-6 shadow-xl cursor-pointer hover:bg-white/85 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl relative"
                      onClick={() => openJournalEntry(entry.date)}
                    >
                      {/* Photos Icon - Top Right */}
                      <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <i className="fas fa-images text-xs"></i>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Preview Text */}
                        <div className="text-gray-800 leading-relaxed">
                          <p className="text-base">{entry.preview}</p>
                        </div>

                                                {/* Entry Metadata */}
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-4">
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              {formatInUserTimezone(entry.updated_at, 'h:mm a')}
                            </span>
                            <span>
                              <i className="fas fa-edit mr-1"></i>
                              Last edited {formatInUserTimezone(entry.updated_at, 'MMM d')}
                            </span>
                          </div>
                          <div className="flex items-center text-blue-600">
                            <span className="mr-2">Read more</span>
                            <i className="fas fa-chevron-right"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/75 backdrop-blur-sm rounded-xl p-8 shadow-xl max-w-md mx-auto">
                <i className="fas fa-book-open text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Journal Entries Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start documenting your thoughts and experiences. Your first journal entry is just a click away.
                </p>
                <Button
                  onClick={() => setLocation('/journal-entry')}
                  className="bg-blue-600 hover:bg-blue-700 text-white mr-3"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Start Writing
                </Button>
                <Button
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="bg-white/50 hover:bg-white/75"
                >
                  <i className="fas fa-home mr-2"></i>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Quick Access - Keep this at the bottom */}
          <QuickAccess />
        </div>
      </div>
    </>
  );
}