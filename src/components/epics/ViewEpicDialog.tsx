import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Epic } from '@/types/epic';

interface ViewEpicDialogProps {
  epic: Epic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewEpicDialog: React.FC<ViewEpicDialogProps> = ({
  epic,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-3'>
            <Avatar className='h-10 w-10'>
              {epic.avatar_url ? (
                <AvatarImage src={epic.avatar_url} alt={epic.name} />
              ) : null}
              <AvatarFallback>
                {epic.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span>{epic.name}</span>
          </DialogTitle>
          <DialogDescription>
            Epic details and information
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Banner Image */}
          {epic.banner_url && (
            <div className='w-full'>
              <img
                src={epic.banner_url}
                alt={`${epic.name} banner`}
                className='w-full h-48 object-cover rounded-lg'
              />
            </div>
          )}

          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>Basic Information</h3>
              <div className='space-y-2'>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Name:
                  </span>
                  <p className='text-sm'>{epic.name}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Created:
                  </span>
                  <p className='text-sm'>
                    {new Date(epic.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Last Updated:
                  </span>
                  <p className='text-sm'>
                    {new Date(epic.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Avatar Display */}
            <div>
              <h3 className='text-lg font-semibold mb-2'>Avatar</h3>
              <div className='flex justify-center'>
                <Avatar className='h-32 w-32'>
                  {epic.avatar_url ? (
                    <AvatarImage src={epic.avatar_url} alt={epic.name} />
                  ) : null}
                  <AvatarFallback className='text-2xl'>
                    {epic.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>Description</h3>
            <div className='bg-muted/50 p-4 rounded-lg'>
              <p className='text-sm leading-relaxed'>
                {epic.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>Learning Outcomes</h3>
            <div className='bg-muted/50 p-4 rounded-lg'>
              {epic.outcomes && epic.outcomes.length > 0 ? (
                <ul className='space-y-2'>
                  {epic.outcomes.map((outcome, index) => (
                    <li key={index} className='flex items-start space-x-2 text-sm'>
                      <span className='text-primary font-medium mt-0.5'>•</span>
                      <span className='leading-relaxed'>{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No learning outcomes specified.
                </p>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>Images</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <h4 className='text-sm font-medium mb-2 text-muted-foreground'>
                  Avatar Image
                </h4>
                {epic.avatar_url ? (
                  <img
                    src={epic.avatar_url}
                    alt={`${epic.name} avatar`}
                    className='w-full h-32 object-cover rounded-lg border'
                  />
                ) : (
                  <div className='w-full h-32 bg-muted rounded-lg flex items-center justify-center'>
                    <span className='text-sm text-muted-foreground'>
                      No avatar image
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className='text-sm font-medium mb-2 text-muted-foreground'>
                  Banner Image
                </h4>
                {epic.banner_url ? (
                  <img
                    src={epic.banner_url}
                    alt={`${epic.name} banner`}
                    className='w-full h-32 object-cover rounded-lg border'
                  />
                ) : (
                  <div className='w-full h-32 bg-muted rounded-lg flex items-center justify-center'>
                    <span className='text-sm text-muted-foreground'>
                      No banner image
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
