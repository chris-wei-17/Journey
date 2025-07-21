import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoSelectionDialog } from "@/components/ui/photo-selection-dialog";

interface PhotoUploadProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleDropFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const totalFiles = photos.length + newFiles.length;

    if (totalFiles > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    onPhotosChange([...photos, ...newFiles]);
  };

  const handleClick = () => {
    setShowDialog(true);
  };

  const handleFileSelect = (file: File) => {
    onPhotosChange([...photos, file]);
    setShowDialog(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleDropFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          photo-upload-area rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${dragOver ? 'border-primary-300 bg-primary-50' : 'border-secondary-300'}
          ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <i className="fas fa-camera text-3xl text-secondary-300 mb-4"></i>
        <p className="text-gray-600 font-medium">
          {photos.length >= maxPhotos ? 'Maximum photos reached' : 'Tap to add photos'}
        </p>
        <p className="text-sm text-gray-500">
          {photos.length}/{maxPhotos} photos
        </p>
      </div>

      <PhotoSelectionDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onFileSelect={handleFileSelect}
      />

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
