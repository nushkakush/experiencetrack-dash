import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EpicsService } from '@/services/epics.service';
import { BulletedInput } from '@/components/ui/bulleted-input';
import type { Epic, UpdateEpicRequest } from '@/types/epic';

interface EditEpicDialogProps {
  epic: Epic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEpicUpdated: () => void;
}

export const EditEpicDialog: React.FC<EditEpicDialogProps> = ({
  epic,
  open,
  onOpenChange,
  onEpicUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateEpicRequest>({
    id: epic.id,
    name: epic.name,
    description: epic.description || '',
    outcomes: epic.outcomes || [],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(epic.avatar_url || '');
  const [bannerPreview, setBannerPreview] = useState<string>(epic.banner_url || '');

  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      id: epic.id,
      name: epic.name,
      description: epic.description || '',
      outcomes: epic.outcomes || [],
    });
    setAvatarPreview(epic.avatar_url || '');
    setBannerPreview(epic.banner_url || '');
    setAvatarFile(null);
    setBannerFile(null);
  }, [epic]);

  const handleInputChange = (field: keyof UpdateEpicRequest, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (
    file: File | null,
    type: 'avatar' | 'banner'
  ) => {
    if (type === 'avatar') {
      setAvatarFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    } else {
      setBannerFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setBannerPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = (type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setAvatarFile(null);
      setAvatarPreview('');
    } else {
      setBannerFile(null);
      setBannerPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: 'Error',
        description: 'Epic name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      let updateData: UpdateEpicRequest = { ...formData };

      // Upload new images if provided
      if (avatarFile) {
        const avatarUrl = await EpicsService.uploadImage(avatarFile, 'avatar');
        updateData.avatar_url = avatarUrl;
      } else if (!avatarPreview) {
        // If preview is empty, set to null to remove existing image
        updateData.avatar_url = '';
      }

      if (bannerFile) {
        const bannerUrl = await EpicsService.uploadImage(bannerFile, 'banner');
        updateData.banner_url = bannerUrl;
      } else if (!bannerPreview) {
        // If preview is empty, set to null to remove existing image
        updateData.banner_url = '';
      }

      await EpicsService.updateEpic(updateData);
      onEpicUpdated();
    } catch (error) {
      console.error('Error updating epic:', error);
      toast({
        title: 'Error',
        description: 'Failed to update epic. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Epic</DialogTitle>
          <DialogDescription>
            Update the epic details and images.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Epic Name *</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder='Enter epic name'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder='Describe the epic...'
                rows={3}
              />
            </div>

            <BulletedInput
              value={formData.outcomes}
              onChange={(value) => handleInputChange('outcomes', value)}
              placeholder='What will learners achieve from this epic?'
              label='Learning Outcomes'
              maxItems={8}
            />
          </div>

          {/* Image Uploads */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Avatar Upload */}
            <div className='space-y-2'>
              <Label>Avatar Image</Label>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
                {avatarPreview ? (
                  <div className='relative'>
                    <img
                      src={avatarPreview}
                      alt='Avatar preview'
                      className='w-full h-32 object-cover rounded-lg'
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={() => handleRemoveImage('avatar')}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <label className='cursor-pointer block text-center'>
                    <Upload className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                    <span className='text-sm text-gray-600'>
                      Click to upload avatar
                    </span>
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] || null, 'avatar')
                      }
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Banner Upload */}
            <div className='space-y-2'>
              <Label>Banner Image</Label>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
                {bannerPreview ? (
                  <div className='relative'>
                    <img
                      src={bannerPreview}
                      alt='Banner preview'
                      className='w-full h-32 object-cover rounded-lg'
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={() => handleRemoveImage('banner')}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <label className='cursor-pointer block text-center'>
                    <Upload className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                    <span className='text-sm text-gray-600'>
                      Click to upload banner
                    </span>
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] || null, 'banner')
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Updating...' : 'Update Epic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
