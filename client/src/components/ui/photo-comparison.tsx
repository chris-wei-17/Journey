import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";

interface Photo {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  date: string;
}

interface PhotoComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  date1: string;
  date2: string;
  date1Photos: Photo[];
  date2Photos: Photo[];
  selectedPhotos: { date1Photo?: Photo; date2Photo?: Photo };
  onPhotoSelect: (photo: Photo, dateIndex: number) => void;
}

interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

export function PhotoComparison({
  isOpen,
  onClose,
  date1,
  date2,
  date1Photos,
  date2Photos,
  selectedPhotos,
  onPhotoSelect
}: PhotoComparisonProps) {
  const [zoom1, setZoom1] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [zoom2, setZoom2] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [isDragging1, setIsDragging1] = useState(false);
  const [isDragging2, setIsDragging2] = useState(false);
  const [dragStart1, setDragStart1] = useState({ x: 0, y: 0 });
  const [dragStart2, setDragStart2] = useState({ x: 0, y: 0 });

  const photo1Ref = useRef<HTMLDivElement>(null);
  const photo2Ref = useRef<HTMLDivElement>(null);

  const formatDisplayDate = (dateStr: string): string => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const resetZoom = (photoIndex: number) => {
    if (photoIndex === 1) {
      setZoom1({ scale: 1, x: 0, y: 0 });
    } else {
      setZoom2({ scale: 1, x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent, photoIndex: number) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(0.5, (photoIndex === 1 ? zoom1.scale : zoom2.scale) + delta), 3);
    
    if (photoIndex === 1) {
      setZoom1(prev => ({ ...prev, scale: newScale }));
    } else {
      setZoom2(prev => ({ ...prev, scale: newScale }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, photoIndex: number) => {
    e.preventDefault();
    if (photoIndex === 1) {
      setIsDragging1(true);
      setDragStart1({ x: e.clientX - zoom1.x, y: e.clientY - zoom1.y });
    } else {
      setIsDragging2(true);
      setDragStart2({ x: e.clientX - zoom2.x, y: e.clientY - zoom2.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging1) {
      setZoom1(prev => ({
        ...prev,
        x: e.clientX - dragStart1.x,
        y: e.clientY - dragStart1.y
      }));
    }
    if (isDragging2) {
      setZoom2(prev => ({
        ...prev,
        x: e.clientX - dragStart2.x,
        y: e.clientY - dragStart2.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging1(false);
    setIsDragging2(false);
  };

  useEffect(() => {
    if (isDragging1 || isDragging2) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging1, isDragging2, dragStart1, dragStart2]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-4">
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Photo Comparison</h2>
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>

          {/* Side-by-side comparison - takes most of the space */}
          {(selectedPhotos.date1Photo || selectedPhotos.date2Photo) && (
            <div className="flex-1 flex gap-4 mb-4 min-h-0">
              {/* Photo 1 */}
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-2">
                  <span className="text-sm font-medium">{formatDisplayDate(date1)}</span>
                  {selectedPhotos.date1Photo && (
                    <Button
                      onClick={() => resetZoom(1)}
                      variant="outline"
                      size="sm"
                      className="ml-2 text-xs"
                    >
                      Reset Zoom
                    </Button>
                  )}
                </div>
                <div 
                  ref={photo1Ref}
                  className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative cursor-move"
                  onWheel={(e) => handleWheel(e, 1)}
                  onMouseDown={(e) => handleMouseDown(e, 1)}
                  style={{ userSelect: 'none' }}
                >
                  {selectedPhotos.date1Photo ? (
                    <img
                      src={selectedPhotos.date1Photo.imageUrl}
                      alt={`Photo from ${formatDisplayDate(date1)}`}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `scale(${zoom1.scale}) translate(${zoom1.x / zoom1.scale}px, ${zoom1.y / zoom1.scale}px)`,
                        transformOrigin: '0 0'
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Select a photo from {formatDisplayDate(date1)}
                    </div>
                  )}
                </div>
              </div>

              {/* Photo 2 */}
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-2">
                  <span className="text-sm font-medium">{formatDisplayDate(date2)}</span>
                  {selectedPhotos.date2Photo && (
                    <Button
                      onClick={() => resetZoom(2)}
                      variant="outline"
                      size="sm"
                      className="ml-2 text-xs"
                    >
                      Reset Zoom
                    </Button>
                  )}
                </div>
                <div 
                  ref={photo2Ref}
                  className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative cursor-move"
                  onWheel={(e) => handleWheel(e, 2)}
                  onMouseDown={(e) => handleMouseDown(e, 2)}
                  style={{ userSelect: 'none' }}
                >
                  {selectedPhotos.date2Photo ? (
                    <img
                      src={selectedPhotos.date2Photo.imageUrl}
                      alt={`Photo from ${formatDisplayDate(date2)}`}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `scale(${zoom2.scale}) translate(${zoom2.x / zoom2.scale}px, ${zoom2.y / zoom2.scale}px)`,
                        transformOrigin: '0 0'
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Select a photo from {formatDisplayDate(date2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom thumbnail rows */}
          <div className="space-y-4">
            {/* Date 1 thumbnails */}
            <div>
              <h3 className="text-sm font-medium mb-2">{formatDisplayDate(date1)}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {date1Photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedPhotos.date1Photo?.id === photo.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => onPhotoSelect(photo, 0)}
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={`Thumbnail ${photo.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Date 2 thumbnails */}
            <div>
              <h3 className="text-sm font-medium mb-2">{formatDisplayDate(date2)}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {date2Photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedPhotos.date2Photo?.id === photo.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => onPhotoSelect(photo, 1)}
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={`Thumbnail ${photo.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}