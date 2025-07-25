import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  date: string;
  createdAt: string;
  imageUrl?: string;  // Updated to match new API response
  thumbnailUrl?: string;
}

interface PhotosBlockProps {
  selectedDate: Date;
}

export function PhotosBlock({ selectedDate }: PhotosBlockProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Get photos for the selected date
  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: [`/api/photos/date/${dateStr}`],
  });



  const uploadPhotosMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('photos', file);
      });
      formData.append('date', dateStr);

      return apiRequest('POST', '/api/photos', formData);
    },
    onSuccess: () => {
      // Invalidate all photo-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/photos/date/${dateStr}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      // Also invalidate any other potential photo queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0]?.toString().includes('/api/photos');
        }
      });
      toast({
        title: "Success",
        description: "Photos uploaded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload photos: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      return apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      // Invalidate all photo-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/photos/date/${dateStr}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      // Also invalidate any other potential photo queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0]?.toString().includes('/api/photos');
        }
      });
      toast({
        title: "Success",
        description: "Photo deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete photo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadPhotosMutation.mutate(files);
    }
  };

  const handleAddPhotos = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    if (photos.length > 0 && currentPhotoIndex < photos.length) {
      const photo = photos[currentPhotoIndex];
      deletePhotoMutation.mutate(photo.id);
      setIsPreviewOpen(false);
    }
  };

  const openPreview = (index: number) => {
    setCurrentPhotoIndex(index);
    setImageLoaded(false); // Reset loading state for new image
    setIsPreviewOpen(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    setImageLoaded(false); // Reset loading state when switching images
    if (direction === 'prev') {
      setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : photos.length - 1);
    } else {
      setCurrentPhotoIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPreviewOpen) return;
      
      if (e.key === 'Escape') {
        setIsPreviewOpen(false);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        navigatePhoto('prev');
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        navigatePhoto('next');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPreviewOpen, photos.length]);

  const getThumbnailUrl = (photo: Photo) => {
    if (photo.thumbnailUrl) {
      return photo.thumbnailUrl;
    }
    // Fallback to legacy API route with authentication
    const token = localStorage.getItem('authToken');
    return token ? `/api/photos/${photo.filename}?thumbnail=true&token=${token}` : '/placeholder-image.jpg';
  };

  const getFullImageUrl = (photo: Photo) => {
    if (photo.imageUrl) {
      return photo.imageUrl;
    }
    // Fallback to legacy API route with authentication
    const token = localStorage.getItem('authToken');
    return token ? `/api/photos/${photo.filename}?token=${token}` : '/placeholder-image.jpg';
  };

  return (
    <>
      <Card className="mb-2 bg-white/75 backdrop-blur-sm border-0 shadow-lg" style={{
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        maxHeight: "70vh"
      }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
            <i className="fas fa-camera text-blue-500 mr-2"></i>
            Progress Photos
            <span className="text-sm text-gray-500 ml-2">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          {photos.length > 0 ? (
            <div 
              className="grid gap-2 mb-4 overflow-y-auto"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                maxHeight: "calc(70vh - 200px)"
              }}
            >
              {photos.map((photo: Photo, index: number) => (
                <div
                  key={photo.id}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openPreview(index)}
                >
                  <img
                    src={getThumbnailUrl(photo)}
                    alt={`Progress photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No photos uploaded {isToday(selectedDate) ? 'today' : 'for this date'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4">
            <Button
              onClick={handleAddPhotos}
              disabled={uploadPhotosMutation.isPending}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-200"
            >
              <i className="fas fa-plus mr-2 text-xs"></i>
              {uploadPhotosMutation.isPending ? 'Uploading...' : 'Add Photos'}
            </Button>
            
            {photos.length > 0 && (
              <Button
                onClick={handleRemovePhoto}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-sm"
              >
                <i className="fas fa-trash text-xs"></i>
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Photo Preview Modal - Responsive sizing */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b">
            <DialogTitle className="text-center text-lg font-semibold">
              Progress Photo {currentPhotoIndex + 1} of {photos.length}
            </DialogTitle>
          </DialogHeader>
          
          {photos.length > 0 && (
            <div className="relative flex items-center justify-center min-h-0 flex-1">
              {/* Left Arrow */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
              )}

              {/* Image Container - Dynamic sizing */}
              <div className="flex items-center justify-center p-4 min-w-0 min-h-0 max-w-[calc(98vw-2rem)] max-h-[calc(98vh-10rem)]">
                {!imageLoaded && (
                  <div className="flex items-center justify-center w-32 h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <img
                  src={getFullImageUrl(photos[currentPhotoIndex])}
                  alt={`Progress photo ${currentPhotoIndex + 1}`}
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
              {photos.length > 1 && (
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
              {photos[currentPhotoIndex]?.originalName}
            </div>
            <Button
              onClick={handleRemovePhoto}
              variant="destructive"
              size="sm"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}