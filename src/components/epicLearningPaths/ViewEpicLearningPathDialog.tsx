import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, User, Target, List, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EpicLearningPathsService } from '@/services/epicLearningPaths.service';
import type { EpicLearningPath, EpicLearningPathWithDetails } from '@/types/epicLearningPath';

interface ViewEpicLearningPathDialogProps {
  learningPath: EpicLearningPath;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewEpicLearningPathDialog: React.FC<ViewEpicLearningPathDialogProps> = ({
  learningPath,
  open,
  onOpenChange,
}) => {
  const [detailedLearningPath, setDetailedLearningPath] = useState<EpicLearningPathWithDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && learningPath) {
      loadDetailedLearningPath();
    }
  }, [open, learningPath]);

  const loadDetailedLearningPath = async () => {
    try {
      setLoading(true);
      const details = await EpicLearningPathsService.getEpicLearningPathWithDetails(learningPath.id);
      setDetailedLearningPath(details);
    } catch (error) {
      console.error('Error loading learning path details:', error);
      setDetailedLearningPath(null);
    } finally {
      setLoading(false);
    }
  };

  if (!detailedLearningPath && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <BookOpen className='h-5 w-5' />
            <span>Learning Path Details</span>
          </DialogTitle>
          <DialogDescription>
            View comprehensive information about this epic learning path.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-sm text-muted-foreground'>Loading learning path details...</p>
            </div>
          </div>
        ) : detailedLearningPath ? (
          <div className='space-y-6'>
            {/* Header Section */}
            <div className='flex items-start space-x-4'>
              <Avatar className='h-16 w-16'>
                {detailedLearningPath.avatar_url ? (
                  <AvatarImage
                    src={detailedLearningPath.avatar_url}
                    alt={detailedLearningPath.title}
                  />
                ) : null}
                <AvatarFallback>
                  <BookOpen className='h-8 w-8' />
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h2 className='text-2xl font-bold'>{detailedLearningPath.title}</h2>
                {detailedLearningPath.description && (
                  <p className='text-muted-foreground mt-2'>{detailedLearningPath.description}</p>
                )}
                <div className='flex items-center space-x-4 mt-3 text-sm text-muted-foreground'>
                  <div className='flex items-center space-x-1'>
                    <Calendar className='h-4 w-4' />
                    <span>Created {new Date(detailedLearningPath.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <User className='h-4 w-4' />
                    <span>Updated {new Date(detailedLearningPath.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Image */}
            {detailedLearningPath.banner_url && (
              <div className='relative'>
                <img
                  src={detailedLearningPath.banner_url}
                  alt={`${detailedLearningPath.title} banner`}
                  className='w-full h-48 object-cover rounded-lg'
                />
              </div>
            )}

            {/* Learning Outcomes */}
            <div>
              <h3 className='text-lg font-semibold mb-3'>Learning Outcomes</h3>
              <div className='bg-muted/50 p-4 rounded-lg'>
                {detailedLearningPath.outcomes && detailedLearningPath.outcomes.length > 0 ? (
                  <ul className='space-y-2'>
                    {detailedLearningPath.outcomes.map((outcome, index) => (
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

            {/* Epics in Learning Path */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-lg font-semibold'>Epics in Learning Path</h3>
                <Badge variant='secondary'>
                  {detailedLearningPath.epics.length} epic{detailedLearningPath.epics.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {detailedLearningPath.epics.length > 0 ? (
                <div className='space-y-3'>
                  {detailedLearningPath.epics.map((epicInPath, index) => (
                    <div
                      key={epicInPath.id}
                      className='flex items-center space-x-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors'
                    >
                      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium'>
                        {epicInPath.order}
                      </div>
                      <Avatar className='h-10 w-10'>
                        {epicInPath.avatar_url ? (
                          <AvatarImage src={epicInPath.avatar_url} alt={epicInPath.name} />
                        ) : null}
                        <AvatarFallback>
                          {epicInPath.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <h4 className='font-medium'>{epicInPath.name}</h4>
                        {epicInPath.description && (
                          <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                            {epicInPath.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  <BookOpen className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No epics added to this learning path yet.</p>
                </div>
              )}
            </div>

            {/* Learning Path Summary */}
            <div className='bg-muted/30 p-4 rounded-lg'>
              <h4 className='font-medium mb-2'>Learning Path Summary</h4>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='text-muted-foreground'>Total Epics:</span>
                  <span className='ml-2 font-medium'>{detailedLearningPath.epics.length}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>Learning Outcomes:</span>
                  <span className='ml-2 font-medium'>
                    {detailedLearningPath.outcomes?.length || 0}
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground'>Created:</span>
                  <span className='ml-2 font-medium'>
                    {new Date(detailedLearningPath.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>Failed to load learning path details.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
