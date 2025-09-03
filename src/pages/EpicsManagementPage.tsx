import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
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
import { EpicsService } from '@/services/epics.service';
import type { Epic } from '@/types/epic';
import DashboardShell from '@/components/DashboardShell';
import { CreateEpicDialog } from '@/components/epics/CreateEpicDialog';
import { EditEpicDialog } from '@/components/epics/EditEpicDialog';
import { ViewEpicDialog } from '@/components/epics/ViewEpicDialog';
import { DeleteEpicDialog } from '@/components/epics/DeleteEpicDialog';

const EpicsManagementPage: React.FC = () => {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const itemsPerPage = 10;

  const loadEpics = async () => {
    try {
      setLoading(true);
      const { data, count } = await EpicsService.getEpics({
        search: searchTerm || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
      setEpics(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading epics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load epics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEpics();
  }, [searchTerm, currentPage]);

  const handleCreateEpic = () => {
    setCreateDialogOpen(true);
  };

  const handleEditEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setEditDialogOpen(true);
  };

  const handleViewEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setViewDialogOpen(true);
  };

  const handleDeleteEpic = (epic: Epic) => {
    setSelectedEpic(epic);
    setDeleteDialogOpen(true);
  };

  const handleEpicCreated = () => {
    setCreateDialogOpen(false);
    loadEpics();
    toast({
      title: 'Success',
      description: 'Epic created successfully.',
    });
  };

  const handleEpicUpdated = () => {
    setEditDialogOpen(false);
    setSelectedEpic(null);
    loadEpics();
    toast({
      title: 'Success',
      description: 'Epic updated successfully.',
    });
  };

  const handleEpicDeleted = () => {
    setDeleteDialogOpen(false);
    setSelectedEpic(null);
    loadEpics();
    toast({
      title: 'Success',
      description: 'Epic deleted successfully.',
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Epic Management</h1>
            <p className='text-muted-foreground'>
              Create and manage learning epics for the platform
            </p>
          </div>
          <Button onClick={handleCreateEpic}>
            <Plus className='mr-2 h-4 w-4' />
            Create Epic
          </Button>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-end'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search epics...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8 w-64'
              />
            </div>
          </div>
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Epic</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center py-8'>
                        Loading epics...
                      </TableCell>
                    </TableRow>
                  ) : epics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center py-8'>
                        No epics found
                      </TableCell>
                    </TableRow>
                  ) : (
                    epics.map((epic) => (
                      <TableRow key={epic.id}>
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <Avatar className='h-10 w-10'>
                              {epic.avatar_url ? (
                                <AvatarImage
                                  src={epic.avatar_url}
                                  alt={epic.name}
                                />
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
                            <div>
                              <div className='font-medium'>{epic.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='max-w-xs'>
                            <div className='text-sm text-muted-foreground truncate'>
                              {epic.description || 'No description'}
                            </div>
                            {epic.outcomes && epic.outcomes.length > 0 && (
                              <div className='text-xs text-muted-foreground mt-1'>
                                {epic.outcomes.length} learning outcome{epic.outcomes.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm'>
                            {new Date(epic.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleViewEpic(epic)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEditEpic(epic)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteEpic(epic)}
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

      <CreateEpicDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onEpicCreated={handleEpicCreated}
      />

      {selectedEpic && (
        <>
          <EditEpicDialog
            epic={selectedEpic}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onEpicUpdated={handleEpicUpdated}
          />

          <ViewEpicDialog
            epic={selectedEpic}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />

          <DeleteEpicDialog
            epic={selectedEpic}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onEpicDeleted={handleEpicDeleted}
          />
        </>
      )}
    </DashboardShell>
  );
};

export default EpicsManagementPage;
