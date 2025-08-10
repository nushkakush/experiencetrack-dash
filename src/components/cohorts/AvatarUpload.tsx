import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X } from 'lucide-react';
import { AvatarService } from '@/services/avatar.service';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { toast } from 'sonner';
import { useAvatarPermissions } from '@/hooks/useAvatarPermissions';
import AvatarDisplay from './AvatarDisplay';
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

interface AvatarUploadProps {
  studentId: string;
  currentAvatarUrl?: string | null;
  studentName: string;
  onAvatarUpdated: (newAvatarUrl?: string | null) => void;
  disabled?: boolean;
}

export default function AvatarUpload({
  studentId,
  currentAvatarUrl,
  studentName,
  onAvatarUpdated,
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canUpload, canView, isSuperAdmin } = useAvatarPermissions();

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

    setIsUploading(true);
    try {
      const result = await AvatarService.uploadAvatar(studentId, file);
      
      if (result.success && result.url) {
        // Update the student's avatar_url in the database
        const updateResult = await cohortStudentsService.update(studentId, {
          avatar_url: result.url,
        });

        if (updateResult.success) {
          toast.success('Avatar uploaded successfully');
          onAvatarUpdated(result.url);
        } else {
          toast.error('Failed to update student profile');
        }
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('An error occurred while uploading the avatar');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          // Update the student's avatar_url in the database
          const updateResult = await cohortStudentsService.update(studentId, {
            avatar_url: null,
          });

          if (updateResult.success) {
            toast.success('Avatar removed successfully');
            onAvatarUpdated(null);
          } else {
            toast.error('Failed to update student profile');
          }
        } else {
          toast.error(deleteResult.error || 'Failed to delete avatar');
        }
      } else {
        // If we can't extract filename, just update the database
        const updateResult = await cohortStudentsService.update(studentId, {
          avatar_url: null,
        });

        if (updateResult.success) {
          toast.success('Avatar removed successfully');
          onAvatarUpdated(null);
        } else {
          toast.error('Failed to update student profile');
        }
      }
    } catch (error) {
      console.error('Avatar deletion error:', error);
      toast.error('An error occurred while deleting the avatar');
    } finally {
      setIsDeleting(false);
    }
  };



  if (!canView) {
    return null; // Don't show avatar component if user can't view
  }

  return (
    <div className="relative">
      {canUpload ? (
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
                <AvatarDisplay
                  avatarUrl={currentAvatarUrl}
                  studentName={studentName}
                  size="md"
                />
                
                {/* Upload overlay for super admins */}
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
                          Are you sure you want to remove the avatar for {studentName}? 
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
      ) : (
        // Simple view-only avatar for non-admins
        <AvatarDisplay
          avatarUrl={currentAvatarUrl}
          studentName={studentName}
          size="md"
        />
      )}
    </div>
  );
}
