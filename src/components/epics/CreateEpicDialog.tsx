import React, { useState } from 'react';
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
import type { CreateEpicRequest } from '@/types/epic';

interface CreateEpicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEpicCreated: () => void;
}

export const CreateEpicDialog: React.FC<CreateEpicDialogProps> = ({
  open,
  onOpenChange,
  onEpicCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEpicRequest>({
    name: '',
    description: '',
    outcomes: [],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const { toast } = useToast();

  const handleInputChange = (field: keyof CreateEpicRequest, value: string | string[]) => {
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
      } else {
        setAvatarPreview('');
      }
    } else {
      setBannerFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setBannerPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setBannerPreview('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Epic name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      let avatarUrl = '';
      let bannerUrl = '';

      // Upload images if provided
      if (avatarFile) {
        avatarUrl = await EpicsService.uploadImage(avatarFile, 'avatar');
      }

      if (bannerFile) {
        bannerUrl = await EpicsService.uploadImage(bannerFile, 'banner');
      }

      // Create the epic
      await EpicsService.createEpic({
        ...formData,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        outcomes: [],
      });
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview('');
      setBannerPreview('');

      onEpicCreated();
    } catch (error) {
      console.error('Error creating epic:', error);
      toast({
        title: 'Error',
        description: 'Failed to create epic. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        outcomes: [],
      });
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview('');
      setBannerPreview('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create New Epic</DialogTitle>
          <DialogDescription>
            Create a new learning epic with details and images.
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
                      onClick={() => handleFileChange(null, 'avatar')}
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
                      onClick={() => handleFileChange(null, 'banner')}
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
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Epic'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
