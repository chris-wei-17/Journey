import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  onImageUpload?: (file: File) => void;
  editable?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm", 
  lg: "w-20 h-20 text-xl",
  xl: "w-32 h-32 text-3xl"
};

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "U";
}

function getGradientFromName(firstName?: string | null, lastName?: string | null): string {
  // Use the app's main gradient theme: indigo → blue → amber
      return "from-primary-500 to-secondary-400";
}

export function Avatar({ firstName, lastName, profileImageUrl, size = "md", onImageUpload, editable = false }: AvatarProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isPhotoSelectionOpen, setIsPhotoSelectionOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(firstName, lastName);
  const gradient = getGradientFromName(firstName, lastName);
  const sizeClass = sizeClasses[size];

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setCropPosition({ x: 0, y: 0 });
    setCropScale(1);
    setIsCropDialogOpen(true);
  };

  const handleSave = () => {
    if (imageFile && onImageUpload) {
      onImageUpload(imageFile);
      setIsCropDialogOpen(false);
      setImageFile(null);
    }
  };

  const getPinchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setLastPinchDistance(getPinchDistance(e.touches));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging && lastTouch) {
      const deltaX = e.touches[0].clientX - lastTouch.x;
      const deltaY = e.touches[0].clientY - lastTouch.y;
      
      setCropPosition(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
      
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && lastPinchDistance) {
      const currentDistance = getPinchDistance(e.touches);
      const scaleChange = currentDistance / lastPinchDistance;
      
      setCropScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
      setLastPinchDistance(currentDistance);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLastTouch(null);
    setLastPinchDistance(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && lastTouch) {
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      setCropPosition(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastTouch(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    setCropScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden`}>
        {profileImageUrl ? (
          <img 
            src={profileImageUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(326, 100%, 70%) 0%, hsl(280, 67%, 77%) 100%)'
            }}
          >
            <span className="font-semibold text-black text-lg">{initials}</span>
          </div>
        )}
      </div>

      {editable && (
        <>
          <div className="mt-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('avatar-photo-upload')?.click()}
              className="text-sm text-center"
            >
              Choose a different picture
            </Button>
          </div>

          <input
            id="avatar-photo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />

          <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Adjust Your Photo</DialogTitle>
                <DialogDescription className="sr-only">
                  Use touch gestures to adjust your profile photo
                </DialogDescription>
              </DialogHeader>
              
              {imageFile && (
                <div className="space-y-4">
                  <div 
                    ref={containerRef}
                    className="relative w-64 h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                  >
                    <img
                      ref={imageRef}
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="w-full h-full object-cover select-none"
                      style={{
                        transform: `scale(${cropScale}) translate(${cropPosition.x}px, ${cropPosition.y}px)`
                      }}
                      draggable={false}
                    />
                    
                    {/* Gray overlay with circular cutout */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full">
                        <defs>
                          <mask id="circleMask">
                            <rect width="100%" height="100%" fill="white" />
                            <circle cx="50%" cy="50%" r="100" fill="black" />
                          </mask>
                        </defs>
                        <rect 
                          width="100%" 
                          height="100%" 
                          fill="rgba(0, 0, 0, 0.5)" 
                          mask="url(#circleMask)" 
                        />
                      </svg>
                      
                      {/* Circle border */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[200px] h-[200px] rounded-full border-2 border-white shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Adjust image as needed
                  </p>

                  <div className="flex space-x-2 pt-4">
                    <Button 
                      onClick={() => setIsCropDialogOpen(false)}
                      variant="outline"
                      className="flex-1 text-center"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                                              className="flex-1 text-center bg-gradient-to-r from-primary-500 to-secondary-400 hover:from-primary-600 hover:to-secondary-500"
                    >
                      Save Photo
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}