import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ImageCropperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  size: number;
}

export default function ImageCropperDialog({
  isOpen,
  onClose,
  imageFile,
  onCropComplete,
}: ImageCropperDialogProps) {
  const [scale, setScale] = useState(1);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, size: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize image when file is provided
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setImageSize({ width, height });
    
    // Create a perfect circular crop area - make it larger
    const minDimension = Math.min(width, height);
    const cropSize = minDimension * 0.85; // 85% of the smaller dimension for better visibility
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;
    
    setCropArea({ x, y, size: cropSize });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if click is within crop area
    const centerX = cropArea.x + cropArea.size / 2;
    const centerY = cropArea.y + cropArea.size / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance <= cropArea.size / 2) {
      setIsDragging(true);
      setDragOffset({
        x: x - centerX,
        y: y - centerY,
      });
    }
  }, [cropArea, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    const newCenterX = x - dragOffset.x;
    const newCenterY = y - dragOffset.y;
    
    // Constrain to image bounds
    const newX = Math.max(cropArea.size / 2, Math.min(imageSize.width - cropArea.size / 2, newCenterX));
    const newY = Math.max(cropArea.size / 2, Math.min(imageSize.height - cropArea.size / 2, newCenterY));
    
    setCropArea(prev => ({
      ...prev,
      x: newX - cropArea.size / 2,
      y: newY - cropArea.size / 2,
    }));
  }, [isDragging, dragOffset, cropArea.size, imageSize, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: CropArea): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Create a perfect square canvas
      const size = crop.size;
      canvas.width = size;
      canvas.height = size;

      ctx.imageSmoothingQuality = 'high';

      // Create circular mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.clip();

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.size * scaleX,
        crop.size * scaleY,
        0,
        0,
        size,
        size,
      );

      ctx.restore();

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'image/jpeg', 0.9);
      });
    },
    [],
  );

  const handleConfirm = async () => {
    if (!imgRef.current || cropArea.size === 0) {
      toast.error('Please select a crop area');
      return;
    }

    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, cropArea);
      onCropComplete(croppedImageBlob);
      handleClose();
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleClose = () => {
    setCropArea({ x: 0, y: 0, size: 0 });
    setScale(1);
    setImageSrc('');
    setImageSize({ width: 0, height: 0 });
    setIsDragging(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Crop Profile Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Simple Zoom Control */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[scale]}
              onValueChange={(value) => setScale(value[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground w-12">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Crop Area */}
          <div 
            ref={containerRef}
            className="flex justify-center bg-muted/30 rounded-lg p-4 relative overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="relative">
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{
                  transform: `scale(${scale})`,
                  maxHeight: '400px',
                  maxWidth: '100%',
                  display: 'block',
                }}
                onLoad={onImageLoad}
                draggable={false}
              />
              
              {/* Custom Circular Crop Overlay */}
              {cropArea.size > 0 && (
                <>
                  {/* Semi-transparent overlay outside the circle */}
                  <div
                    className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"
                    style={{
                      mask: `radial-gradient(circle ${cropArea.size * scale / 2}px at ${cropArea.x * scale + cropArea.size * scale / 2}px ${cropArea.y * scale + cropArea.size * scale / 2}px, transparent 0%, transparent 100%, black 100%)`,
                      WebkitMask: `radial-gradient(circle ${cropArea.size * scale / 2}px at ${cropArea.x * scale + cropArea.size * scale / 2}px ${cropArea.y * scale + cropArea.size * scale / 2}px, transparent 0%, transparent 100%, black 100%)`,
                    }}
                  />
                  
                  {/* Dotted Circle Border */}
                  <div
                    className="absolute pointer-events-none border-2 border-dashed border-white rounded-full"
                    style={{
                      left: cropArea.x * scale,
                      top: cropArea.y * scale,
                      width: cropArea.size * scale,
                      height: cropArea.size * scale,
                      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={cropArea.size === 0}>
              <Check className="h-4 w-4 mr-2" />
              Save Profile Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
