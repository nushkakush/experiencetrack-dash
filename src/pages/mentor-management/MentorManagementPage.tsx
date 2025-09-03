import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { AddMentorDialog } from './AddMentorDialog';
import { ViewMentorDialog } from './ViewMentorDialog';
import { EditMentorDialog } from './EditMentorDialog';
import { DeleteMentorDialog } from './DeleteMentorDialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, X, Eye, Edit, Trash2, MoreHorizontal, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MentorsService } from '@/services/mentors.service';
import type { Mentor } from '@/types/mentor';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import BulkUploadDialog from '@/components/common/BulkUploadDialog';
import { BulkUploadConfig } from '@/components/common/bulk-upload/types';
import { BulkMentorUploadService, BulkMentorUpload } from '@/services/bulkUpload/bulkMentorUpload.service';

const statusColor: Record<Mentor['status'], string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  on_leave: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

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



const MentorManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Bulk upload configuration
  const bulkUploadConfig: BulkUploadConfig<BulkMentorUpload> = {
    requiredHeaders: ['first_name', 'last_name', 'email'],
    optionalHeaders: ['phone', 'specialization', 'experience_years', 'current_company', 'designation', 'linkedin_url', 'bio', 'internal_notes', 'status'],
    validateRow: BulkMentorUploadService.validateMentorRow,
    processValidData: async (data: BulkMentorUpload[], duplicateHandling: 'ignore' | 'overwrite') => {
      const result = await BulkMentorUploadService.processMentorUpload(
        data,
        profile?.user_id || '',
        duplicateHandling
      );
      return result;
    },
    checkDuplicates: BulkMentorUploadService.checkDuplicateMentors,
    templateData: `first_name,last_name,email,phone,specialization,experience_years,current_company,designation,linkedin_url,bio,internal_notes,status
John,Doe,john.doe@example.com,+1234567890,Frontend,5,Acme Corp,Senior Developer,https://linkedin.com/in/johndoe,Experienced frontend developer,Great mentor,active
Jane,Smith,jane.smith@example.com,+1234567891,Backend,8,Tech Inc,Lead Engineer,https://linkedin.com/in/janesmith,Backend specialist with 8 years experience,Excellent technical skills,active`,
    dialogTitle: 'Bulk Import Mentors',
    dialogDescription: 'Upload a CSV file to import multiple mentors at once. Download the template below for the correct format. Status should be one of: active, inactive, on_leave.',
    fileType: 'CSV',
    fileExtension: '.csv',
  };

  const loadMentors = async () => {
    setLoading(true);
    const result = await MentorsService.listMentors();
    if (result.success) {
      setMentors(result.data);
    } else {
      toast.error(result.error || 'Failed to load mentors');
    }
    setLoading(false);
  };

  const handleBulkUploadSuccess = () => {
    loadMentors(); // Reload mentors after successful bulk upload
    toast.success('Mentors imported successfully');
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const filtered = useMemo(() => {
    let filteredMentors = mentors;

    // Apply search filter
    const term = search.trim().toLowerCase();
    if (term) {
      filteredMentors = filteredMentors.filter(m =>
        [
          m.first_name,
          m.last_name,
          m.email,
          m.specialization || '',
          m.current_company || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredMentors = filteredMentors.filter(m => m.status === statusFilter);
    }

    // Apply specialization filter
    if (specializationFilter !== 'all') {
      filteredMentors = filteredMentors.filter(m => m.specialization === specializationFilter);
    }

    return filteredMentors;
  }, [mentors, search, statusFilter, specializationFilter]);

  const handleAddMentor = () => {
    // Open dialog via custom event; dialog lives alongside this page (to be implemented)
    window.dispatchEvent(new CustomEvent('open-add-mentor-dialog'));
  };

  const handleViewMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowViewDialog(true);
  };

  const handleEditMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowEditDialog(true);
  };

  const handleDeleteMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMentor = async () => {
    if (!selectedMentor) return;

    const result = await MentorsService.deleteMentor(selectedMentor.id);
    if (result.success) {
      toast.success('Mentor deleted successfully');
      loadMentors();
      setShowDeleteDialog(false);
      setSelectedMentor(null);
    } else {
      toast.error(result.error || 'Failed to delete mentor');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSpecializationFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || specializationFilter !== 'all';

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Mentor Management</h1>
            <p className='text-muted-foreground'>
              {loading ? 'Loading...' : `${filtered.length} mentor${filtered.length === 1 ? '' : 's'} found`}
            </p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={handleAddMentor}>
              <Plus className='h-4 w-4 mr-2' />
              Add Mentor
            </Button>
            <BulkUploadDialog
              config={bulkUploadConfig}
              onSuccess={handleBulkUploadSuccess}
              trigger={
                <Button variant='outline'>
                  <Upload className='h-4 w-4 mr-2' />
                  Bulk Import
                </Button>
              }
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by name, email, specialization, company'
              className='pl-8'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className='flex gap-2'>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='on_leave'>On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='Specialization' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Specializations</SelectItem>
                {SPECIALIZATION_OPTIONS.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant='outline' size='sm' onClick={clearFilters}>
                <X className='h-4 w-4 mr-1' />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Mentors Table */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={m.avatar_url || ''} alt={`${m.first_name} ${m.last_name}`} />
                        <AvatarFallback className='text-xs'>
                          {getInitials(m.first_name, m.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='font-medium'>
                        {m.first_name} {m.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.specialization || '—'}</TableCell>
                  <TableCell>{m.current_company || '—'}</TableCell>
                  <TableCell>{m.designation || '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[m.status] || ''}>{m.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleViewMentor(m)}>
                          <Eye className='h-4 w-4 mr-2' />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMentor(m)}>
                          <Edit className='h-4 w-4 mr-2' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMentor(m)}
                          className='text-red-600 focus:text-red-600'
                        >
                          <Trash2 className='h-4 w-4 mr-2' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center text-muted-foreground py-8'>
                    {hasActiveFilters ? 'No mentors match your filters' : 'No mentors found'}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        {/* Dialogs */}
        <AddMentorDialog onCreated={loadMentors} />
        
        <ViewMentorDialog
          mentor={selectedMentor}
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
        />
        
        <EditMentorDialog
          mentor={selectedMentor}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onUpdated={loadMentors}
        />
        
        <DeleteMentorDialog
          mentor={selectedMentor}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDeleteMentor}
        />
      </div>
    </DashboardShell>
  );
};

export default MentorManagementPage;


