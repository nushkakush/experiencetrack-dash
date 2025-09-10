import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExperiencesService } from '@/services/experiences.service';
import {
  ExperienceStepperDialog,
  ViewExperienceDialog,
  DeleteExperienceDialog,
} from '@/components/experiences';
import { MagicBriefsTab } from '@/components/experiences/MagicBriefsTab';
import DashboardShell from '@/components/DashboardShell';
import { EpicSelector } from '@/components/common/EpicSelector';
import { useActiveEpic } from '@/contexts/ActiveEpicContext';
import type { Experience, ExperienceType } from '@/types/experience';
import { EXPERIENCE_TYPES } from '@/types/experience';

const ExperienceDesignManagementPage: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('experiences');

  // Epic context
  const { activeEpicId, setActiveEpicId } = useActiveEpic();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();
  const itemsPerPage = 10;

  // Fetch experiences
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const { data, count } = await ExperiencesService.getExperiences({
        search: searchTerm || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        epicId: activeEpicId || undefined, // Filter by active epic
        limit: itemsPerPage,
        offset,
        excludeCustom: true, // Only show library experiences for design management
      });

      setExperiences(data);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch experiences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [currentPage, searchTerm, typeFilter, activeEpicId]);

  // Refresh experiences when switching to the experiences tab
  useEffect(() => {
    if (activeTab === 'experiences') {
      setLoading(true);
      fetchExperiences();
    } else {
      // Clear experiences when switching away to prevent stale data
      setExperiences([]);
      setTotalCount(0);
      setTotalPages(0);
      setLoading(false);
    }
  }, [activeTab]);

  // Listen for upserted experiences and refresh table
  useEffect(() => {
    const handler = () => {
      if (activeTab === 'experiences') {
        fetchExperiences();
      }
    };
    window.addEventListener('experience:upserted', handler);
    return () => window.removeEventListener('experience:upserted', handler);
  }, [activeTab]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCreateExperience = () => {
    console.log('➕ handleCreateExperience called, opening create dialog');
    setSelectedExperience(null);
    setCreateDialogOpen(true);
  };

  const handleEditExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setEditDialogOpen(true);
  };

  const handleViewExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setViewDialogOpen(true);
  };

  const handleDeleteExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedExperience) return;

    try {
      setDeleteLoading(true);
      await ExperiencesService.deleteExperience(selectedExperience.id);

      toast({
        title: 'Success',
        description: 'Experience deleted successfully.',
      });

      setDeleteDialogOpen(false);
      setSelectedExperience(null);
      fetchExperiences(); // Refresh the list
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete experience. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExperienceSaved = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedExperience(null);
    fetchExperiences(); // Refresh the list
  };

  const handleCreateDialogClose = (open: boolean) => {
    console.log('📝 handleCreateDialogClose called with:', {
      open,
      currentState: createDialogOpen,
    });
    setCreateDialogOpen(open);
  };

  const handleEditDialogClose = (open: boolean) => {
    console.log('✏️ handleEditDialogClose called with:', {
      open,
      currentState: editDialogOpen,
    });
    setEditDialogOpen(open);
  };

  const getTypeColor = (type: ExperienceType) => {
    switch (type) {
      case 'CBL':
        return 'bg-blue-100 text-blue-800';
      case 'Mock Challenge':
        return 'bg-green-100 text-green-800';
      case 'Masterclass':
        return 'bg-purple-100 text-purple-800';
      case 'Workshop':
        return 'bg-orange-100 text-orange-800';
      case 'GAP':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Experience Design
            </h1>
            <p className='text-muted-foreground'>
              Design and manage learning experiences with structured content and
              assessment.
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <EpicSelector
              selectedEpicId={activeEpicId}
              onEpicChange={setActiveEpicId}
              placeholder='Select Epic'
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList>
            <TabsTrigger
              value='experiences'
              className='flex items-center gap-2'
            >
              <FileText className='h-4 w-4' />
              Experiences
            </TabsTrigger>
            <TabsTrigger
              value='magic-briefs'
              className='flex items-center gap-2'
            >
              <Sparkles className='h-4 w-4' />
              Magic Briefs
            </TabsTrigger>
          </TabsList>

          <TabsContent value='experiences' className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold'>All Experiences</h2>
                <p className='text-muted-foreground text-sm'>
                  Manage your learning experiences and content
                </p>
              </div>
              <Button onClick={handleCreateExperience} disabled={!activeEpicId}>
                <Plus className='h-4 w-4 mr-2' />
                Add Experience
              </Button>
            </div>

            {/* Filters */}
            {activeEpicId && (
              <div className='flex items-center space-x-4'>
                <div className='flex-1 max-w-sm'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      placeholder='Search experiences...'
                      value={searchTerm}
                      onChange={e => handleSearch(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>
                <div className='w-48'>
                  <Select value={typeFilter} onValueChange={handleTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder='Filter by type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      {EXPERIENCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* No Epic Selected Message */}
            {!activeEpicId && (
              <div className='border-2 border-dashed border-muted rounded-lg p-8 text-center'>
                <Zap className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                <h3 className='text-lg font-medium mb-2'>
                  Select an Epic to Get Started
                </h3>
                <p className='text-muted-foreground mb-4'>
                  Choose an epic from the dropdown above to view and manage
                  experiences for that epic.
                </p>
              </div>
            )}

            {/* Experiences Table */}
            {activeEpicId && (
              <div className='border rounded-lg'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Learning Outcomes</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center py-8'>
                          <div className='flex items-center justify-center space-x-2'>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
                            <span>Loading experiences...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : experiences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center py-8'>
                          <div className='text-muted-foreground'>
                            {searchTerm || typeFilter !== 'all'
                              ? 'No experiences found matching your criteria.'
                              : 'No experiences created yet. Get started by creating your first experience.'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      experiences.map(experience => (
                        <TableRow key={experience.id}>
                          <TableCell>
                            <div className='space-y-1'>
                              <div className='font-medium'>
                                {experience.title}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {experience.type} Experience
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(experience.type)}>
                              {experience.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='max-w-xs'>
                              {experience.learning_outcomes &&
                              experience.learning_outcomes.length > 0 ? (
                                <div className='text-sm text-muted-foreground'>
                                  {experience.learning_outcomes.length} outcome
                                  {experience.learning_outcomes.length !== 1
                                    ? 's'
                                    : ''}
                                </div>
                              ) : (
                                <div className='text-sm text-muted-foreground'>
                                  No outcomes defined
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center space-x-1 text-sm text-muted-foreground'>
                              <Calendar className='h-3 w-3' />
                              <span>{formatDate(experience.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end space-x-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleViewExperience(experience)}
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleEditExperience(experience)}
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  handleDeleteExperience(experience)
                                }
                                className='text-destructive hover:text-destructive'
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
              </div>
            )}

            {/* Pagination */}
            {activeEpicId && totalPages > 1 && (
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of{' '}
                  {totalCount} experiences
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className='text-sm'>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='magic-briefs'>
            <MagicBriefsTab />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <ExperienceStepperDialog
          key='create'
          open={createDialogOpen}
          onOpenChange={handleCreateDialogClose}
          onExperienceSaved={handleExperienceSaved}
          existingExperience={null}
        />

        <ExperienceStepperDialog
          key={selectedExperience?.id || 'edit'}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          onExperienceSaved={handleExperienceSaved}
          existingExperience={selectedExperience}
        />

        <ViewExperienceDialog
          experience={selectedExperience}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />

        <DeleteExperienceDialog
          experience={selectedExperience}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      </div>
    </DashboardShell>
  );
};

export default ExperienceDesignManagementPage;
