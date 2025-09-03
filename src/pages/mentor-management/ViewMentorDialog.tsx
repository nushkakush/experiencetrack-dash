import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Mentor } from '@/types/mentor';

interface ViewMentorDialogProps {
  mentor: Mentor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColor: Record<Mentor['status'], string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  on_leave: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

export const ViewMentorDialog: React.FC<ViewMentorDialogProps> = ({
  mentor,
  open,
  onOpenChange,
}) => {
  if (!mentor) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Mentor Details</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Avatar and Basic Info */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-20 w-20'>
                <AvatarImage src={mentor.avatar_url || ''} alt={`${mentor.first_name} ${mentor.last_name}`} />
                <AvatarFallback className='text-lg'>
                  {getInitials(mentor.first_name, mentor.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className='space-y-2'>
                <h2 className='text-2xl font-bold'>
                  {mentor.first_name} {mentor.last_name}
                </h2>
                {mentor.specialization && (
                  <Badge variant='outline'>{mentor.specialization}</Badge>
                )}
              </div>
            </div>
            <div className='flex flex-col items-end gap-2'>
              <Badge className={statusColor[mentor.status] || ''}>
                {mentor.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Contact Information</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>Email</label>
                <p className='text-sm'>{mentor.email}</p>
              </div>
              {mentor.phone && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Phone</label>
                  <p className='text-sm'>{mentor.phone}</p>
                </div>
              )}
              {mentor.linkedin_url && (
                <div className='md:col-span-2'>
                  <label className='text-sm font-medium text-muted-foreground'>LinkedIn</label>
                  <p className='text-sm'>
                    <a 
                      href={mentor.linkedin_url} 
                      target='_blank' 
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline'
                    >
                      {mentor.linkedin_url}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Professional Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Professional Information</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {mentor.current_company && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Current Company</label>
                  <p className='text-sm'>{mentor.current_company}</p>
                </div>
              )}
              {mentor.designation && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Designation</label>
                  <p className='text-sm'>{mentor.designation}</p>
                </div>
              )}
              {mentor.experience_years && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Experience</label>
                  <p className='text-sm'>{mentor.experience_years} years</p>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {mentor.bio && (
            <>
              <Separator />
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Bio</h3>
                <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{mentor.bio}</p>
              </div>
            </>
          )}

          {/* Internal Notes */}
          {mentor.internal_notes && (
            <>
              <Separator />
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Internal Notes</h3>
                <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{mentor.internal_notes}</p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Metadata</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground'>
              <div>
                <label className='font-medium'>Created</label>
                <p>{new Date(mentor.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className='font-medium'>Last Updated</label>
                <p>{new Date(mentor.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewMentorDialog;
