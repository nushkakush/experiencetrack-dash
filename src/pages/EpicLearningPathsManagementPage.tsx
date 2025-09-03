import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { EpicLearningPathsService } from '@/services/epicLearningPaths.service';
import type { EpicLearningPath } from '@/types/epicLearningPath';
import DashboardShell from '@/components/DashboardShell';
import { EpicLearningPathStepperDialog } from '@/components/epicLearningPaths/EpicLearningPathStepperDialog';
import { ViewEpicLearningPathDialog } from '@/components/epicLearningPaths/ViewEpicLearningPathDialog';
import { DeleteEpicLearningPathDialog } from '@/components/epicLearningPaths/DeleteEpicLearningPathDialog';

const EpicLearningPathsManagementPage: React.FC = () => {
  const [learningPaths, setLearningPaths] = useState<EpicLearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLearningPath, setSelectedLearningPath] = useState<EpicLearningPath | null>(null);
  const [stepperDialogOpen, setStepperDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const itemsPerPage = 10;

  const loadLearningPaths = async () => {
    try {
      setLoading(true);
      const { data, count } = await EpicLearningPathsService.getEpicLearningPaths({
        search: searchTerm || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
      setLearningPaths(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading epic learning paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load epic learning paths. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearningPaths();
  }, [searchTerm, currentPage]);

  const handleCreateLearningPath = () => {
    setSelectedLearningPath(null);
    setStepperDialogOpen(true);
  };

  const handleEditLearningPath = (learningPath: EpicLearningPath) => {
    setSelectedLearningPath(learningPath);
    setStepperDialogOpen(true);
  };

  const handleViewLearningPath = (learningPath: EpicLearningPath) => {
    setSelectedLearningPath(learningPath);
    setViewDialogOpen(true);
  };

  const handleDeleteLearningPath = (learningPath: EpicLearningPath) => {
    setSelectedLearningPath(learningPath);
    setDeleteDialogOpen(true);
  };

  const handleLearningPathSaved = () => {
    setStepperDialogOpen(false);
    setSelectedLearningPath(null);
    loadLearningPaths();
    toast({
      title: 'Success',
      description: selectedLearningPath ? 'Epic learning path updated successfully.' : 'Epic learning path created successfully.',
    });
  };

  const handleLearningPathDeleted = () => {
    setDeleteDialogOpen(false);
    setSelectedLearningPath(null);
    loadLearningPaths();
    toast({
      title: 'Success',
      description: 'Epic learning path deleted successfully.',
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Epic Learning Paths</h1>
            <p className='text-muted-foreground'>
              Create and manage structured learning paths with multiple epics
            </p>
          </div>
          <Button onClick={handleCreateLearningPath}>
            <Plus className='mr-2 h-4 w-4' />
            Create Learning Path
          </Button>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-end'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search learning paths...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8 w-64'
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learning Path</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Epics</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8'>
                    Loading learning paths...
                  </TableCell>
                </TableRow>
              ) : learningPaths.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8'>
                    No learning paths found
                  </TableCell>
                </TableRow>
              ) : (
                learningPaths.map((learningPath) => (
                  <TableRow key={learningPath.id}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-10 w-10'>
                          {learningPath.avatar_url ? (
                            <AvatarImage
                              src={learningPath.avatar_url}
                              alt={learningPath.title}
                            />
                          ) : null}
                          <AvatarFallback>
                            <BookOpen className='h-5 w-5' />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>{learningPath.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='max-w-xs'>
                        <div className='text-sm text-muted-foreground truncate'>
                          {learningPath.description || 'No description'}
                        </div>
                        {learningPath.outcomes && learningPath.outcomes.length > 0 && (
                          <div className='text-xs text-muted-foreground mt-1'>
                            {learningPath.outcomes.length} learning outcome{learningPath.outcomes.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <Badge variant='secondary'>
                          {learningPath.epics.length} epic{learningPath.epics.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {new Date(learningPath.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleViewLearningPath(learningPath)}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditLearningPath(learningPath)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteLearningPath(learningPath)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className='flex items-center justify-between pt-4'>
              <div className='text-sm text-muted-foreground'>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{' '}
                {totalCount} results
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className='text-sm'>
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EpicLearningPathStepperDialog
        open={stepperDialogOpen}
        onOpenChange={setStepperDialogOpen}
        onLearningPathSaved={handleLearningPathSaved}
        existingLearningPath={selectedLearningPath}
      />

      {selectedLearningPath && (
        <>
          <ViewEpicLearningPathDialog
            learningPath={selectedLearningPath}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />

          <DeleteEpicLearningPathDialog
            learningPath={selectedLearningPath}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onLearningPathDeleted={handleLearningPathDeleted}
          />
        </>
      )}
    </DashboardShell>
  );
};

export default EpicLearningPathsManagementPage;
