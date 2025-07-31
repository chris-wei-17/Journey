import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { QuickAccess } from "@/components/ui/quick-access";
import { PinProtection } from "@/components/ui/pin-protection";
import { PhotoComparison } from "@/components/ui/photo-comparison";
import { useAuth } from "@/hooks/useAuth";

interface Photo {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  date: string;
  createdAt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface PhotosByDate {
  [date: string]: Photo[];
}

export default function Photos() {
  const [, setLocation] = useLocation();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentDatePhotos, setCurrentDatePhotos] = useState<Photo[]>([]);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'setup' | 'verify'>('setup');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Comparison feature state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ date1Photo?: Photo; date2Photo?: Photo }>({});

    // Fetch all photos
  const { data: allPhotos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ['/api/photos'],
  });

  // Check PIN protection on component mount
  useEffect(() => {
    if (!user) return;

    if (user.photosPinEnabled === null) {
      // First time - show setup dialog
      setPinMode('setup');
      setIsPinDialogOpen(true);
    } else if (user.photosPinEnabled === true) {
      // PIN enabled - require verification every time
      setPinMode('verify');
      setIsPinDialogOpen(true);
    } else {
      // PIN disabled
      setIsUnlocked(true);
    }
  }, [user]);

  const handlePinSuccess = () => {
    setIsUnlocked(true);
  };

  // Comparison feature handlers
  const handleCompareClick = () => {
    setIsCompareMode(true);
    setSelectedDates([]);
  };

  const handleDateSelect = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else if (selectedDates.length < 2) {
      const newDates = [...selectedDates, dateStr];
      setSelectedDates(newDates);
      
      // If two dates selected, open comparison
      if (newDates.length === 2) {
        setIsComparisonOpen(true);
      }
    }
  };

  const handleExitCompare = () => {
    setIsCompareMode(false);
    setSelectedDates([]);
    setIsComparisonOpen(false);
    setSelectedPhotos({});
  };

  const handlePhotoSelect = (photo: Photo, dateIndex: number) => {
    if (dateIndex === 0) {
      setSelectedPhotos(prev => ({ ...prev, date1Photo: photo }));
    } else {
      setSelectedPhotos(prev => ({ ...prev, date2Photo: photo }));
    }
  };

  // Group photos by date
  const photosByDate: PhotosByDate = {};
  allPhotos.forEach(photo => {
    const dateKey = photo.date;
    if (!photosByDate[dateKey]) {
      photosByDate[dateKey] = [];
    }
    photosByDate[dateKey].push(photo);
  });



  // Sort dates and get sorted date keys
  const sortedDates = Object.keys(photosByDate).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b).getTime() - new Date(a).getTime();
    } else {
      return new Date(a).getTime() - new Date(b).getTime();
    }
  });



  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  const getThumbnailUrl = (photo: Photo): string => {
    if (photo.thumbnailUrl) {
      return photo.thumbnailUrl;
    }
    // Fallback to legacy API route with authentication
    const token = localStorage.getItem('authToken');
    return token ? `/api/photos/${photo.filename}?thumbnail=true&token=${token}` : '/placeholder-image.jpg';
  };

  const getFullImageUrl = (photo: Photo): string => {
    if (photo.imageUrl) {
      return photo.imageUrl;
    }
    // Fallback to legacy API route with authentication
    const token = localStorage.getItem('authToken');
    return token ? `/api/photos/${photo.filename}?token=${token}` : '/placeholder-image.jpg';
  };

  const openPreview = (photo: Photo, datePhotos: Photo[]) => {
    setCurrentPhoto(photo);
    setCurrentDatePhotos(datePhotos);
    setCurrentPhotoIndex(datePhotos.findIndex(p => p.id === photo.id));
    setImageLoaded(false);
    setIsPreviewOpen(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (currentDatePhotos.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : currentDatePhotos.length - 1;
    } else {
      newIndex = currentPhotoIndex < currentDatePhotos.length - 1 ? currentPhotoIndex + 1 : 0;
    }
    
    setCurrentPhotoIndex(newIndex);
    setCurrentPhoto(currentDatePhotos[newIndex]);
    setImageLoaded(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPreviewOpen) return;
      
      if (e.key === 'ArrowLeft') {
        navigatePhoto('prev');
      } else if (e.key === 'ArrowRight') {
        navigatePhoto('next');
      } else if (e.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPreviewOpen, currentPhotoIndex, currentDatePhotos]);

  const formatDisplayDate = (dateStr: string): string => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (isLoading || !isUnlocked) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
          <Header 
            title="Photos"
            showBackButton={false}
            showHomeButton={true}
            onBack={handleBack}
        />
          <div className="flex items-center justify-center pt-[calc(env(safe-area-inset-top)+6rem)]">
            {isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>}
          </div>
        </div>
        <PinProtection 
          isOpen={isPinDialogOpen}
          onClose={() => setIsPinDialogOpen(false)}
          mode={pinMode}
          onSuccess={handlePinSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
        <Header 
          title="Photos"
          showBackButton={false}
          showHomeButton={true}
          onBack={handleBack}
        />
        
        <div className="pt-[calc(env(safe-area-inset-top)+6rem)] px-4 pb-6">
          {/* Compare and Sort Controls */}
          <div className="flex justify-between items-center mb-6">
            {/* Compare Button */}
            <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-lg">
              <Button
                onClick={isCompareMode ? handleExitCompare : handleCompareClick}
                variant={isCompareMode ? 'destructive' : 'default'}
                size="sm"
                className={`${isCompareMode ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
              >
                {isCompareMode ? 'EXIT' : 'COMPARE'}
              </Button>
            </div>

            {/* Sort Control */}
            <div className="bg-white/75 backdrop-blur-sm rounded-lg shadow-lg">
              <Button
                variant="default"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <i className={`fas ${sortOrder === 'newest' ? 'fa-arrow-up' : 'fa-arrow-down'} mr-2`}></i>
                Sort
              </Button>
            </div>
          </div>

          {/* Photos by Date */}
          {sortedDates.length > 0 ? (
            <div className="space-y-8">
              {sortedDates.map(dateStr => {
                const datePhotos = photosByDate[dateStr];
                const displayPhotos = datePhotos.slice(0, 5); // Show up to 5 thumbnails
                const hasMore = datePhotos.length > 5;

                return (
                  <div 
                    key={dateStr} 
                    className={`space-y-3 relative ${isCompareMode ? 'cursor-pointer' : ''}`}
                    onClick={isCompareMode ? () => handleDateSelect(dateStr) : undefined}
                  >
                    {/* Date Header - Right Aligned */}
                    <div className="flex justify-end items-center">
                      {isCompareMode && (
                        <div className="mr-4">
                          <input
                            type="checkbox"
                            checked={selectedDates.includes(dateStr)}
                            onChange={() => handleDateSelect(dateStr)}
                            className="w-5 h-5 text-blue-600 rounded"
                            disabled={!selectedDates.includes(dateStr) && selectedDates.length >= 2}
                          />
                        </div>
                      )}
                      <div className="bg-white/75 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {formatDisplayDate(dateStr)}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {datePhotos.length} photo{datePhotos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Photo Thumbnails */}
                    <div className={`bg-white/75 backdrop-blur-sm rounded-xl p-4 shadow-xl relative ${isCompareMode && !selectedDates.includes(dateStr) ? 'opacity-50' : ''}`}>
                      {isCompareMode && !selectedDates.includes(dateStr) && (
                        <div className="absolute inset-0 bg-gray-600/50 rounded-xl z-10 pointer-events-none"></div>
                      )}
                      <div 
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                          maxWidth: "100%"
                        }}
                      >
                        {displayPhotos.map((photo, index) => (
                          <div
                            key={photo.id}
                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            onClick={() => openPreview(photo, datePhotos)}
                          >
                            <img
                              src={getThumbnailUrl(photo)}
                              alt={`Photo ${index + 1} from ${formatDisplayDate(dateStr)}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            
                            {/* Photo overlay with index */}
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                        
                        {/* Show more indicator if there are additional photos */}
                        {hasMore && (
                          <div 
                            className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                            onClick={() => openPreview(datePhotos[5], datePhotos)}
                          >
                            <div className="text-center text-gray-600">
                              <i className="fas fa-plus text-2xl mb-2"></i>
                              <p className="text-sm font-medium">
                                +{datePhotos.length - 5} more
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/75 backdrop-blur-sm rounded-xl p-8 shadow-xl max-w-md mx-auto">
                <i className="fas fa-camera text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Photos Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start your fitness journey by adding progress photos from the dashboard.
                </p>
                <Button
                  onClick={() => setLocation('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <i className="fas fa-home mr-2"></i>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Quick Access */}
          <QuickAccess/>
        </div>
      </div>

      {/* Photo Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b">
            <DialogTitle className="text-center text-lg font-semibold">
              {currentPhoto && (
                <>
                  Photo {currentPhotoIndex + 1} of {currentDatePhotos.length}
                  <span className="block text-sm text-gray-600 font-normal">
                    {formatDisplayDate(currentPhoto.date)}
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {currentPhoto && (
            <div className="relative flex items-center justify-center min-h-0 flex-1">
              {/* Left Arrow */}
              {currentDatePhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
              )}

              {/* Image Container */}
              <div className="flex items-center justify-center p-4 min-w-0 min-h-0 max-w-[calc(98vw-2rem)] max-h-[calc(98vh-10rem)]">
                {!imageLoaded && (
                  <div className="flex items-center justify-center w-32 h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <img
                  src={getFullImageUrl(currentPhoto)}
                  alt={`Photo from ${formatDisplayDate(currentPhoto.date)}`}
                  className={`max-w-full max-h-full object-contain rounded-lg shadow-lg transition-opacity duration-200 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    maxWidth: 'calc(98vw - 2rem)',
                    maxHeight: 'calc(98vh - 10rem)'
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </div>

              {/* Right Arrow */}
              {currentDatePhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10"
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              )}
            </div>
          )}

          <div className="p-4 pt-2 flex justify-between items-center flex-shrink-0 border-t bg-gray-50/50">
            <div className="text-sm text-gray-500">
              {currentPhoto?.originalName}
            </div>
            <div className="text-xs text-gray-400">
              Press ← → to navigate • ESC to close
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Comparison Modal */}
      {isComparisonOpen && selectedDates.length === 2 && (
        <PhotoComparison
          isOpen={isComparisonOpen}
          onClose={handleExitCompare}
          date1={selectedDates[0]}
          date2={selectedDates[1]}
          date1Photos={photosByDate[selectedDates[0]] || []}
          date2Photos={photosByDate[selectedDates[1]] || []}
          selectedPhotos={selectedPhotos}
          onPhotoSelect={handlePhotoSelect}
        />
      )}
    </>
  );
}