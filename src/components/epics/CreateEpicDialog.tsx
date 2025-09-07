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
    subject: '',
    description: '',
    outcomes: [],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const { toast } = useToast();

  const handleInputChange = (
    field: keyof CreateEpicRequest,
    value: string | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null, type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setAvatarFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = e => setAvatarPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setAvatarPreview('');
      }
    } else {
      setBannerFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = e => setBannerPreview(e.target?.result as string);
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

      // Check if name already exists
      const nameExists = await EpicsService.checkNameExists(
        formData.name.trim()
      );
      if (nameExists) {
        toast({
          title: 'Error',
          description: `An epic with the name "${formData.name}" already exists. Please choose a different name.`,
          variant: 'destructive',
        });
        return;
      }

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

      toast({
        title: 'Success',
        description: 'Epic created successfully!',
        variant: 'default',
      });

      onEpicCreated();
    } catch (error) {
      console.error('Error creating epic:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to create epic. Please try again.',
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
        subject: '',
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
                    onClick={() => handleFileChange(null, 'avatar')}
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
                      onChange={e =>
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
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder='Enter epic name'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='subject'>Subject</Label>
              <Input
                id='subject'
                value={formData.subject}
                onChange={e => handleInputChange('subject', e.target.value)}
                placeholder='Enter subject (e.g., Mathematics, Science, Programming)'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder='Describe the epic...'
                rows={3}
              />
            </div>

            <BulletedInput
              value={formData.outcomes}
              onChange={value => handleInputChange('outcomes', value)}
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
                      onClick={() => handleFileChange(null, 'banner')}
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
                      onChange={e =>
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
