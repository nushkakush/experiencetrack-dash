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
    subject: epic.subject || '',
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
      subject: epic.subject || '',
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
          {/* Avatar Image Section - At the very top */}
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>Avatar Image</Label>
            <div className='flex justify-center'>
              {avatarPreview ? (
                <div className='relative group'>
                  <div className='w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden'>
                    <img
                      src={avatarPreview}
                      alt='Avatar preview'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    className='absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                    onClick={() => handleRemoveImage('avatar')}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              ) : (
                <label className='cursor-pointer block'>
                  <div className='w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center group'>
                    <Upload className='h-6 w-6 text-gray-400 group-hover:text-gray-500' />
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] || null, 'avatar')
                      }
                    />
                  </div>
                </label>
              )}
            </div>
            <p className='text-xs text-gray-500 text-center'>
              Recommended: Square image, 200x200px or larger
            </p>
          </div>

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
              <Label htmlFor='subject'>Subject</Label>
              <Input
                id='subject'
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder='Enter subject (e.g., Mathematics, Science, Programming)'
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
            />
          </div>

          {/* Banner Image Section */}
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>Banner Image</Label>
            <div className='relative'>
              {bannerPreview ? (
                <div className='relative group'>
                  <img
                    src={bannerPreview}
                    alt='Banner preview'
                    className='w-full h-48 object-cover rounded-lg shadow-sm'
                  />
                  <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center'>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                      onClick={() => handleRemoveImage('banner')}
                    >
                      <X className='h-4 w-4 mr-1' />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label className='cursor-pointer block'>
                  <div className='border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200 rounded-lg p-8 text-center group'>
                    <Upload className='mx-auto h-12 w-12 text-gray-400 group-hover:text-gray-500 mb-3' />
                    <div className='space-y-1'>
                      <p className='text-sm font-medium text-gray-700'>
                        Upload Banner Image
                      </p>
                      <p className='text-xs text-gray-500'>
                        Recommended: 1200x400px or similar aspect ratio
                      </p>
                    </div>
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] || null, 'banner')
                      }
                    />
                  </div>
                </label>
              )}
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
