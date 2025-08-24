import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X } from 'lucide-react';
import { AvatarService } from '@/services/avatar.service';
import { profileService } from '@/services/profile.service';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageCropperDialog from '@/components/cohorts/ImageCropperDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProfileAvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarUpdated: (newAvatarUrl?: string | null) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileAvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
  disabled = false,
  size = 'md',
}: ProfileAvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Additional client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    // Set the selected file and show cropper
    setSelectedFile(file);
    setShowCropper(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploading(true);
    try {
      // Convert blob to file
      const croppedFile = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      const result = await AvatarService.uploadAvatar(userId, croppedFile);
      
      if (result.success && result.data?.url) {
        // Update the user's avatar_url in the database
        const updateResult = await profileService.updateProfile(userId, {
          avatar_url: result.data.url,
        });

        if (updateResult.success) {
          toast.success('Avatar uploaded successfully');
          onAvatarUpdated(result.data.url);
        } else {
          toast.error('Failed to update profile');
        }
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('An error occurred while uploading the avatar');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setShowCropper(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatarUrl) return;

    setIsDeleting(true);
    try {
      // Extract filename from URL
      const fileName = AvatarService.getFileNameFromUrl(currentAvatarUrl);
      
      if (fileName) {
        // Delete from storage
        const deleteResult = await AvatarService.deleteAvatar(fileName);
        
        if (deleteResult.success) {
          // Update the user's avatar_url in the database
          const updateResult = await profileService.updateProfile(userId, {
            avatar_url: null,
          });

          if (updateResult.success) {
            toast.success('Avatar removed successfully');
            onAvatarUpdated(null);
          } else {
            toast.error('Failed to update profile');
          }
        } else {
          toast.error(deleteResult.error || 'Failed to delete avatar');
        }
      } else {
        // If we can't extract filename, just update the database
        const updateResult = await profileService.updateProfile(userId, {
          avatar_url: null,
        });

        if (updateResult.success) {
          toast.success('Avatar removed successfully');
          onAvatarUpdated(null);
        } else {
          toast.error('Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Avatar deletion error:', error);
      toast.error('An error occurred while deleting the avatar');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <TooltipProvider>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || disabled}
        />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`relative inline-block ${!disabled ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (!disabled && !isUploading) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <Avatar className={sizeClasses[size]}>
                {currentAvatarUrl ? (
                  <AvatarImage 
                    src={AvatarService.getAvatarUrl(
                      AvatarService.getFileNameFromUrl(currentAvatarUrl),
                      { 
                        width: size === 'sm' ? 32 : size === 'md' ? 48 : 80, 
                        height: size === 'sm' ? 32 : size === 'md' ? 48 : 80, 
                        quality: 80 
                      }
                    )} 
                    alt={userName}
                  />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload overlay for users without avatar */}
              {!disabled && !currentAvatarUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="h-4 w-4 text-white" />
                </div>
              )}
              
              {/* Loading overlay */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              )}
              
              {/* Delete button for existing avatars */}
              {!disabled && currentAvatarUrl && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-background"
                      disabled={isDeleting}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDeleting ? (
                        <Skeleton className="h-3 w-3 rounded-full" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Avatar</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove your avatar? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAvatar}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Removing..." : "Remove Avatar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TooltipTrigger>
          {!disabled && (
            <TooltipContent>
              <p>Click to upload avatar</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* Image Cropper Dialog */}
      <ImageCropperDialog
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false);
          setSelectedFile(null);
        }}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
