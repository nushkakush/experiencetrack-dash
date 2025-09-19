import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MentorsService } from '@/services/mentors.service';
import { AvatarService } from '@/services/avatar.service';
import type { CreateMentorData } from '@/types/mentor';
import ImageCropperDialog from '@/components/cohorts/ImageCropperDialog';

const SPECIALIZATION_OPTIONS = [
  'Frontend',
  'Backend',
  'Fullstack',
  'Data Science',
  'DevOps',
  'Product Management',
  'Design',
  'Other',
];

export const AddMentorDialog: React.FC<{ onCreated?: () => void }> = ({
  onCreated,
}) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<
    CreateMentorData & { status: 'active' | 'inactive' | 'on_leave' }
  >({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    experience_years: undefined,
    current_company: '',
    designation: '',
    linkedin_url: '',
    bio: '',
    avatar_url: '',
    internal_notes: '',
    status: 'active',
  });

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-add-mentor-dialog', handler as EventListener);
    return () =>
      window.removeEventListener(
        'open-add-mentor-dialog',
        handler as EventListener
      );
  }, []);

  const reset = () => {
    setForm({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      specialization: '',
      experience_years: undefined,
      current_company: '',
      designation: '',
      linkedin_url: '',
      bio: '',
      avatar_url: '',
      internal_notes: '',
      status: 'active',
    });
    setSelectedFile(null);
    setShowCropper(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
      );
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        'File size too large. Please upload an image smaller than 5MB.'
      );
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploadingAvatar(true);
    try {
      // Convert blob to file
      const croppedFile = new File([croppedImageBlob], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      // Generate a temporary ID for the mentor (we'll use timestamp)
      const tempId = `mentor-${Date.now()}`;
      const result = await AvatarService.uploadAvatar(tempId, croppedFile);

      if (result.success && result.data?.url) {
        setForm(prev => ({ ...prev, avatar_url: result.data.url }));
        toast.success('Avatar uploaded successfully');
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('An error occurred while uploading the avatar');
    } finally {
      setIsUploadingAvatar(false);
      setSelectedFile(null);
      setShowCropper(false);
    }
  };

  const handleRemoveAvatar = () => {
    setForm(prev => ({ ...prev, avatar_url: '' }));
    toast.success('Avatar removed');
  };

  const handleSubmit = async () => {
    const errors: string[] = [];

    if (!form.email) {
      errors.push('Email is required');
    }
    if (!form.first_name) {
      errors.push('First name is required');
    }
    if (!form.last_name) {
      errors.push('Last name is required');
    }

    if (errors.length > 0) {
      if (errors.length === 1) {
        toast.error(errors[0]);
      } else {
        toast.error(`Please fix the following: ${errors.join(', ')}`);
      }
      return;
    }
    setLoading(true);
    const { status, ...mentorData } = form;
    const res = await MentorsService.createMentor(
      mentorData,
      profile?.user_id || ''
    );
    if (res.success) {
      // Set the status after creation
      await MentorsService.setMentorStatus(res.data.id, status);
      toast.success('Mentor added');
      onCreated?.();
      setOpen(false);
      reset();
    } else {
      toast.error(res.error || 'Failed to add mentor');
    }
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>Add Mentor</DialogTitle>
          <DialogDescription>Enter mentor details manually.</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Avatar Upload Section */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-16 w-16'>
                <AvatarImage
                  src={form.avatar_url || ''}
                  alt={`${form.first_name} ${form.last_name}`}
                />
                <AvatarFallback>
                  {form.first_name && form.last_name
                    ? getInitials(form.first_name, form.last_name)
                    : 'M'}
                </AvatarFallback>
              </Avatar>
              <div className='space-y-2'>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Upload className='h-4 w-4 mr-2' />
                    {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                  </Button>
                  {form.avatar_url && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <X className='h-4 w-4 mr-2' />
                      Remove
                    </Button>
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Upload a profile picture (JPEG, PNG, WebP, GIF - max 5MB)
                </p>
              </div>
            </div>
            <div className='flex flex-col items-end gap-2'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={v =>
                    setForm(prev => ({ ...prev, status: v as any }))
                  }
                >
                  <SelectTrigger className='w-[140px]'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='on_leave'>On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            className='hidden'
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Email *</Label>
              <Input
                type='email'
                placeholder='mentor@company.com'
                value={form.email}
                onChange={e =>
                  setForm(prev => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Phone</Label>
              <Input
                placeholder='+1 (555) 123-4567'
                value={form.phone}
                onChange={e =>
                  setForm(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>First name *</Label>
              <Input
                placeholder='John'
                value={form.first_name}
                onChange={e =>
                  setForm(prev => ({ ...prev, first_name: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Last name *</Label>
              <Input
                placeholder='Doe'
                value={form.last_name}
                onChange={e =>
                  setForm(prev => ({ ...prev, last_name: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Specialization</Label>
              <Select
                value={form.specialization || ''}
                onValueChange={v =>
                  setForm(prev => ({ ...prev, specialization: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select specialization' />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATION_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Experience (years)</Label>
              <Input
                type='number'
                min={0}
                value={form.experience_years ?? ''}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    experience_years: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Current company</Label>
              <Input
                value={form.current_company || ''}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    current_company: e.target.value,
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Designation</Label>
              <Input
                value={form.designation || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, designation: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>LinkedIn URL</Label>
              <Input
                placeholder='https://linkedin.com/in/username'
                value={form.linkedin_url || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, linkedin_url: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>Bio</Label>
              <Textarea
                rows={3}
                value={form.bio || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, bio: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>Internal notes</Label>
              <Textarea
                rows={3}
                value={form.internal_notes || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, internal_notes: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Image Cropper Dialog */}
      {showCropper && selectedFile && (
        <ImageCropperDialog
          isOpen={showCropper}
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
        />
      )}
    </Dialog>
  );
};

export default AddMentorDialog;
