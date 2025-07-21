import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PhotoSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export function PhotoSelectionDialog({ isOpen, onClose, onFileSelect }: PhotoSelectionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
      onClose();
    }
  };

  const openPhotoLibrary = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFileChooser = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Select Photo</DialogTitle>
            <DialogDescription className="text-center">
              Choose how you'd like to add your profile photo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button
              onClick={openPhotoLibrary}
              variant="outline"
              className="w-full text-center justify-center"
            >
              <i className="fas fa-images mr-2"></i>
              Photo Library
            </Button>
            
            <Button
              onClick={openCamera}
              variant="outline"
              className="w-full text-center justify-center"
            >
              <i className="fas fa-camera mr-2"></i>
              Take Photo
            </Button>
            
            <Button
              onClick={openFileChooser}
              variant="outline"
              className="w-full text-center justify-center"
            >
              <i className="fas fa-folder mr-2"></i>
              Choose Files
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-center justify-center"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}