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
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Target, Calendar, Users, Clock, Award } from 'lucide-react';
import type { Epic } from '@/types/epic';
import { EpicDetailsTabs } from './EpicDetailsTabs';

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
      <DialogContent className='max-w-6xl max-h-[95vh] overflow-y-auto p-0'>
        <DialogTitle className='sr-only'>{epic.name} - Epic Details</DialogTitle>
        <DialogDescription className='sr-only'>
          View detailed information about the {epic.name} epic including description and learning outcomes.
        </DialogDescription>
        
        {/* Enhanced Header with Banner and Overlapping Avatar */}
        <div className='relative'>
          {/* Banner Image */}
          {epic.banner_url ? (
            <div className='w-full h-72 overflow-hidden'>
              <img
                src={epic.banner_url}
                alt={`${epic.name} banner`}
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent' />
            </div>
          ) : (
            <div className='w-full h-72 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center'>
              <div className='text-center'>
                <BookOpen className='h-20 w-20 text-primary/40 mx-auto mb-3' />
                <p className='text-2xl font-semibold text-primary/70'>{epic.name}</p>
              </div>
            </div>
          )}

          {/* Overlapping Avatar with enhanced styling */}
          <div className='absolute -bottom-16 left-8'>
            <div className='w-32 h-32 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-white'>
              {epic.avatar_url ? (
                <img
                  src={epic.avatar_url}
                  alt={epic.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center'>
                  <span className='text-3xl font-bold text-primary/60'>
                    {epic.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className='pt-20 px-8 pb-8 space-y-8'>
          {/* Epic Title and Metadata */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <h1 className='text-4xl font-bold text-foreground'>{epic.name}</h1>
              {epic.subject && (
                <div className='flex items-center space-x-2'>
                  <BookOpen className='h-5 w-5 text-muted-foreground' />
                  <Badge variant='secondary' className='text-sm px-3 py-1'>
                    {epic.subject}
                  </Badge>
                </div>
              )}
            </div>

            {/* Epic Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Card className='p-4'>
                <CardContent className='p-0'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 bg-primary/10 rounded-lg'>
                      <Target className='h-5 w-5 text-primary' />
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Learning Outcomes</p>
                      <p className='text-lg font-semibold'>{epic.outcomes?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className='p-4'>
                <CardContent className='p-0'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 bg-blue-100 rounded-lg'>
                      <BookOpen className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Epic Type</p>
                      <p className='text-lg font-semibold'>Learning Path</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='p-4'>
                <CardContent className='p-0'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 bg-green-100 rounded-lg'>
                      <Award className='h-5 w-5 text-green-600' />
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>Status</p>
                      <p className='text-lg font-semibold'>Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Description */}
          {epic.description && (
            <div className='space-y-4'>
              <h2 className='text-2xl font-semibold flex items-center space-x-3'>
                <div className='p-2 bg-primary/10 rounded-lg'>
                  <BookOpen className='h-6 w-6 text-primary' />
                </div>
                <span>About This Epic</span>
              </h2>
              <Card className='border-2 border-primary/10'>
                <CardContent className='p-6'>
                  <p className='text-foreground leading-relaxed text-lg'>
                    {epic.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Tabbed Content */}
          <div className='space-y-6'>
            <h2 className='text-2xl font-semibold flex items-center space-x-3'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Target className='h-6 w-6 text-primary' />
              </div>
              <span>Epic Details</span>
            </h2>
            <EpicDetailsTabs epic={epic} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
