import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
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

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "U";
}

function getGradientFromName(firstName?: string, lastName?: string): string {
  const name = (firstName || "") + (lastName || "");
  const gradients = [
    "from-primary-300 to-lavender-300",
    "from-secondary-300 to-accent-300", 
    "from-accent-300 to-primary-300",
    "from-lavender-300 to-secondary-300",
    "from-primary-400 to-accent-400",
    "from-secondary-400 to-lavender-400"
  ];
  
  // Use name hash to consistently pick a gradient
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function Avatar({ firstName, lastName, profileImageUrl, size = "md", onImageUpload, editable = false }: AvatarProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const initials = getInitials(firstName, lastName);
  const gradient = getGradientFromName(firstName, lastName);
  const sizeClass = sizeClasses[size];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setIsDialogOpen(true);
    }
  };

  const handleSave = () => {
    if (imageFile && onImageUpload) {
      onImageUpload(imageFile);
      setIsDialogOpen(false);
      setImageFile(null);
    }
  };

  const handleTakePhoto = () => {
    // For web apps, this would typically open a camera interface
    // For now, we'll just trigger the file picker
    document.getElementById('photo-upload')?.click();
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
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="font-semibold text-white">{initials}</span>
          </div>
        )}
      </div>

      {editable && (
        <>
          <div className="mt-3 flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('photo-upload')?.click()}
              className="text-sm"
            >
              <i className="fas fa-upload mr-2"></i>
              Upload Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTakePhoto}
              className="text-sm"
            >
              <i className="fas fa-camera mr-2"></i>
              Take Photo
            </Button>
          </div>

          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adjust Your Photo</DialogTitle>
              </DialogHeader>
              
              {imageFile && (
                <div className="space-y-4">
                  <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scale(${cropScale}) translate(${cropPosition.x}px, ${cropPosition.y}px)`
                      }}
                    />
                    <div className="absolute inset-0 border-4 border-white rounded-full shadow-lg pointer-events-none" 
                         style={{ 
                           width: '200px', 
                           height: '200px', 
                           top: '50%', 
                           left: '50%', 
                           transform: 'translate(-50%, -50%)' 
                         }} 
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Scale</label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={cropScale}
                        onChange={(e) => setCropScale(parseFloat(e.target.value))}
                        className="w-full mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Position X</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={cropPosition.x}
                        onChange={(e) => setCropPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Position Y</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={cropPosition.y}
                        onChange={(e) => setCropPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button 
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="flex-1 bg-gradient-to-r from-primary-300 to-lavender-300 hover:from-primary-400 hover:to-lavender-400"
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