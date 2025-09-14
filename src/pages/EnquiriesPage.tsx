import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { EnquiriesService } from '@/services/enquiries.service';
import type {
  Enquiry,
  EnquiryFilters,
  EnquiryStats,
  PaginatedEnquiryResponse,
} from '@/types/enquiries';
import {
  MessageCircle,
  Search,
  Filter,
  Download,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Briefcase,
  Target,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  Cloud,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import DashboardShell from '@/components/DashboardShell';

// Removed status config as we no longer use status system

const professionalStatusConfig = {
  student: {
    label: 'Student',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  'A Working Professional': {
    label: 'Working Professional',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  'In Between Jobs': {
    label: 'In Between Jobs',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [paginationData, setPaginationData] =
    useState<PaginatedEnquiryResponse | null>(null);
  const [stats, setStats] = useState<EnquiryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EnquiryFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiries, setSelectedEnquiries] = useState<Set<string>>(
    new Set()
  );
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formNames, setFormNames] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Dynamic columns based on form data
  const getVisibleColumns = () => {
    if (enquiries.length === 0) return [];

    const sampleEnquiry = enquiries[0];
    const columns = [];

    // Always show these columns (actions will be added at the end)
    columns.push('name', 'contact', 'created');

    // Form-specific column logic
    const formName = sampleEnquiry.form_name;

    // For Program files-Brochure form, show age and professional status
    if (formName === 'Program files-Brochure') {
      // Show professional status if any enquiry has it
      if (sampleEnquiry.professional_status) {
        columns.push('professional_status');
      }

      // Show age if any enquiry has it (age is directly from Webflow for this form)
      if (sampleEnquiry.age !== undefined && sampleEnquiry.age !== null) {
        columns.push('age');
      }
    }
    // For Contact Form, show these additional columns
    else if (formName === 'Contact Form') {
      // Show professional status if any enquiry has it
      if (sampleEnquiry.professional_status) {
        columns.push('professional_status');
      }

      // Show location if any enquiry has it
      if (sampleEnquiry.location) {
        columns.push('location');
      }

      // Show relocation if any enquiry has it
      if (sampleEnquiry.relocation_possible) {
        columns.push('relocation');
      }

      // Show investment if any enquiry has it
      if (sampleEnquiry.investment_willing) {
        columns.push('investment');
      }

      // Show gender if any enquiry has it
      if (sampleEnquiry.gender) {
        columns.push('gender');
      }

      // Show career goals if any enquiry has it
      if (sampleEnquiry.career_goals) {
        columns.push('career_goals');
      }

      // Show course of interest if any enquiry has it
      if (sampleEnquiry.course_of_interest) {
        columns.push('course_of_interest');
      }

      // Show UTM parameters if any enquiry has them
      if (sampleEnquiry.utm_source || sampleEnquiry.utm_campaign) {
        columns.push('utm_info');
      }
    }

    // Always add actions at the end
    columns.push('actions');

    return columns;
  };

  const visibleColumns = getVisibleColumns();

  // Helper function to get age display
  const getAgeDisplay = (enquiry: Enquiry): string | null => {
    // For Program Files form, use the age field directly from Webflow
    if (enquiry.form_name === 'Program files-Brochure') {
      if (
        enquiry.age !== undefined &&
        enquiry.age !== null &&
        enquiry.age > 0
      ) {
        return `${enquiry.age} years old`;
      } else {
        return null; // Don't show age if it doesn't exist
      }
    }

    // For other forms, calculate from date of birth
    try {
      // Return null if date_of_birth is null or undefined
      if (!enquiry.date_of_birth) {
        return null;
      }

      const today = new Date();
      const birthDate = new Date(enquiry.date_of_birth);

      if (isNaN(birthDate.getTime())) {
        return null; // Don't show age if date of birth is invalid
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age > 0 ? `${age} years old` : null;
    } catch (error) {
      return null; // Don't show age if calculation fails
    }
  };

  // Helper function to render table cell content
  const renderTableCell = (enquiry: Enquiry, column: string) => {
    switch (column) {
      case 'name': {
        const ageDisplay = getAgeDisplay(enquiry);
        const isDeleted = enquiry.deleted_at !== null;
        return (
          <div className='flex items-center space-x-2'>
            <User
              className={`h-4 w-4 ${isDeleted ? 'text-red-400' : 'text-muted-foreground'}`}
            />
            <div>
              <div
                className={`font-medium ${isDeleted ? 'text-red-600 line-through' : ''}`}
              >
                {enquiry.full_name}
                {isDeleted && (
                  <span className='ml-2 text-xs text-red-500'>(Deleted)</span>
                )}
              </div>
              <div className='text-sm text-muted-foreground'>
                {enquiry.gender &&
                  `${enquiry.gender}${ageDisplay ? ' • ' : ''}`}
                {ageDisplay}
              </div>
            </div>
          </div>
        );
      }

      case 'contact': {
        return (
          <div className='space-y-1'>
            <div className='flex items-center space-x-1 text-sm'>
              <Mail className='h-3 w-3' />
              <span>{enquiry.email}</span>
            </div>
            <div className='flex items-center space-x-1 text-sm'>
              <Phone className='h-3 w-3' />
              <span>{enquiry.phone}</span>
            </div>
          </div>
        );
      }

      // Removed status case as we no longer use status system

      case 'professional_status': {
        const profStatusInfo =
          professionalStatusConfig[enquiry.professional_status];
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${profStatusInfo.className}`}
          >
            {profStatusInfo.label}
          </span>
        );
      }

      case 'location': {
        return enquiry.location ? (
          <div className='flex items-center space-x-1 text-sm'>
            <MapPin className='h-3 w-3' />
            <span>{enquiry.location}</span>
          </div>
        ) : null;
      }

      case 'relocation': {
        return (
          <span className='px-2 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200'>
            {enquiry.relocation_possible}
          </span>
        );
      }

      case 'investment': {
        return (
          <span className='px-2 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200'>
            {enquiry.investment_willing}
          </span>
        );
      }

      case 'gender': {
        return enquiry.gender ? (
          <span className='px-2 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200'>
            {enquiry.gender}
          </span>
        ) : null;
      }

      case 'career_goals': {
        return enquiry.career_goals ? (
          <div className='max-w-xs truncate text-sm'>
            {enquiry.career_goals}
          </div>
        ) : null;
      }

      case 'age': {
        return enquiry.age !== undefined && enquiry.age !== null ? (
          <Badge variant='secondary'>{enquiry.age} years old</Badge>
        ) : null;
      }

      case 'course_of_interest': {
        return enquiry.course_of_interest ? (
          <div className='max-w-xs truncate text-sm'>
            {enquiry.course_of_interest}
          </div>
        ) : null;
      }

      case 'utm_info': {
        const hasUtmData =
          enquiry.utm_source || enquiry.utm_campaign || enquiry.utm_medium;
        return hasUtmData ? (
          <div className='space-y-1 text-xs'>
            <div className='flex items-center space-x-2 mb-2'>
              <Badge
                variant='default'
                className='bg-blue-100 text-blue-800 border-blue-200'
              >
                Paid Campaign
              </Badge>
            </div>
            {enquiry.utm_source && (
              <div className='flex items-center space-x-1'>
                <span className='text-muted-foreground'>Source:</span>
                <span className='font-mono'>{enquiry.utm_source}</span>
              </div>
            )}
            {enquiry.utm_campaign && (
              <div className='flex items-center space-x-1'>
                <span className='text-muted-foreground'>Campaign:</span>
                <span className='font-mono truncate max-w-20'>
                  {enquiry.utm_campaign}
                </span>
              </div>
            )}
            {enquiry.utm_medium && (
              <div className='flex items-center space-x-1'>
                <span className='text-muted-foreground'>Medium:</span>
                <span className='font-mono truncate max-w-20'>
                  {enquiry.utm_medium}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className='flex items-center space-x-2'>
            <Badge
              variant='secondary'
              className='bg-gray-100 text-gray-600 border-gray-200'
            >
              Organic
            </Badge>
          </div>
        );
      }

      case 'created': {
        return (
          <div className='flex items-center space-x-1 text-sm text-muted-foreground'>
            <Calendar className='h-3 w-3' />
            <span>
              {format(
                new Date(enquiry.wf_created_at || enquiry.created_at),
                'MMM dd, yyyy'
              )}
            </span>
          </div>
        );
      }

      case 'actions': {
        return (
          <div className='flex items-center space-x-2'>
            <Button variant='ghost' size='sm'>
              <Eye className='h-4 w-4' />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='ghost' size='sm' disabled={deleting}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the enquiry from{' '}
                    {enquiry.full_name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteEnquiry(enquiry.id)}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      }

      default: {
        return null;
      }
    }
  };

  const loadEnquiries = async () => {
    const requestId = crypto.randomUUID();
    const currentFilters = {
      ...filters,
      page: currentPage,
      pageSize: pageSize,
      show_deleted: showDeleted,
    };

    // Add form name filter if a specific form is selected
    if (activeTab) {
      currentFilters.form_name = activeTab;
    }

    console.log(
      `[EnquiriesPage:${requestId}] Loading enquiries with filters:`,
      currentFilters
    );

    try {
      setLoading(true);
      const result = await EnquiriesService.getEnquiries(currentFilters);
      console.log(
        `[EnquiriesPage:${requestId}] Successfully loaded ${result.data.length} enquiries (page ${result.page}/${result.totalPages})`
      );
      setEnquiries(result.data);
      setPaginationData(result);
    } catch (error) {
      console.error(`[EnquiriesPage:${requestId}] Error loading enquiries:`, {
        error: error,
        message: error.message,
        stack: error.stack,
      });
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const requestId = crypto.randomUUID();
    console.log(`[EnquiriesPage:${requestId}] Loading enquiry statistics...`);

    try {
      const data = await EnquiriesService.getEnquiryStats();
      console.log(
        `[EnquiriesPage:${requestId}] Successfully loaded stats:`,
        data
      );
      setStats(data);
    } catch (error) {
      console.error(`[EnquiriesPage:${requestId}] Error loading stats:`, {
        error: error,
        message: error.message,
        stack: error.stack,
      });
    }
  };

  const loadFormNames = async () => {
    try {
      const data = await EnquiriesService.getFormNames();
      console.log('Loaded form names:', data);
      setFormNames(data);
      // Set the first form as active if no tab is currently selected
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0]);
      }
    } catch (error) {
      console.error('Error loading form names:', error);
    }
  };

  useEffect(() => {
    loadEnquiries();
    loadStats();
    loadFormNames();
  }, [filters, activeTab, currentPage, pageSize, showDeleted]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedEnquiries(new Set()); // Clear selections when changing tabs
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedEnquiries(new Set()); // Clear selections when changing pages
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (key: keyof EnquiryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handleSelectEnquiry = (enquiryId: string, checked: boolean) => {
    setSelectedEnquiries(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(enquiryId);
      } else {
        newSet.delete(enquiryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEnquiries(new Set(enquiries.map(e => e.id)));
    } else {
      setSelectedEnquiries(new Set());
    }
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    try {
      setDeleting(true);
      await EnquiriesService.deleteEnquiry(enquiryId);
      toast.success('Enquiry deleted successfully');
      loadEnquiries();
      loadStats();
      setSelectedEnquiries(prev => {
        const newSet = new Set(prev);
        newSet.delete(enquiryId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast.error('Failed to delete enquiry');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEnquiries.size === 0) return;

    try {
      setDeleting(true);
      await EnquiriesService.deleteEnquiries(Array.from(selectedEnquiries));
      toast.success(`${selectedEnquiries.size} enquiries deleted successfully`);
      loadEnquiries();
      loadStats();
      setSelectedEnquiries(new Set());
    } catch (error) {
      console.error('Error deleting enquiries:', error);
      toast.error('Failed to delete enquiries');
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncFromWebflow = async () => {
    try {
      setSyncing(true);
      const result = await EnquiriesService.syncFromWebflow();
      console.log('Sync result:', result);

      if (result.synced > 0) {
        toast.success(
          `Successfully synced ${result.synced} new enquiries from Webflow`
        );
        loadEnquiries();
        loadStats();
        loadFormNames(); // Reload form names after sync
      } else {
        toast.info('No new enquiries found in Webflow');
      }

      if (result.errors > 0) {
        toast.warning(
          `${result.errors} submissions had errors and were skipped`
        );
      }
    } catch (error) {
      console.error('Error syncing from Webflow:', error);
      toast.error(
        'Failed to sync from Webflow. Please check your API configuration.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const exportEnquiries = () => {
    const csvContent = [
      [
        'Name',
        'Email',
        'Phone',
        'Professional Status',
        'Location',
        'Course Interest',
        'UTM Source',
        'UTM Campaign',
        'UTM Medium',
        'Form Name',
        'Created At',
      ],
      ...enquiries.map(enquiry => [
        enquiry.full_name,
        enquiry.email,
        enquiry.phone,
        enquiry.professional_status,
        enquiry.location || '',
        enquiry.course_of_interest || '',
        enquiry.utm_source || '',
        enquiry.utm_campaign || '',
        enquiry.utm_medium || '',
        enquiry.form_name || 'Unknown Form',
        format(
          new Date(enquiry.wf_created_at || enquiry.created_at),
          'yyyy-MM-dd HH:mm:ss'
        ),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Enquiries</h1>
            <p className='text-muted-foreground'>
              Manage enquiries from your website form submissions
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {selectedEnquiries.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive' disabled={deleting}>
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete ({selectedEnquiries.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Enquiries</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedEnquiries.size}{' '}
                      selected enquiry{selectedEnquiries.size > 1 ? 'ies' : ''}?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              onClick={handleSyncFromWebflow}
              variant='outline'
              disabled={syncing}
            >
              <Cloud className='h-4 w-4 mr-2' />
              {syncing ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Syncing...
                </>
              ) : (
                'Sync from Webflow'
              )}
            </Button>
            <Button
              onClick={() => EnquiriesService.downloadWebflowSyncLogs()}
              variant='outline'
              disabled={!EnquiriesService.getWebflowSyncLogs()}
            >
              <FileText className='h-4 w-4 mr-2' />
              Download Sync Logs
            </Button>
            <Button onClick={exportEnquiries} variant='outline'>
              <Download className='h-4 w-4 mr-2' />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Leads
                </CardTitle>
                <MessageCircle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Last 24 Hours
                </CardTitle>
                <div className='h-2 w-2 bg-green-500 rounded-full'></div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.last_24_hours}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Paid Leads
                </CardTitle>
                <div className='h-2 w-2 bg-blue-500 rounded-full'></div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.paid_leads}</div>
                <p className='text-xs text-muted-foreground'>
                  +{stats.paid_leads_24h} in last 24h
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Non-Paid Leads
                </CardTitle>
                <div className='h-2 w-2 bg-gray-500 rounded-full'></div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.non_paid_leads}</div>
                <p className='text-xs text-muted-foreground'>
                  +{stats.non_paid_leads_24h} in last 24h
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Tabs */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Filter by Form</h2>
            <div className='text-sm text-muted-foreground'>
              {formNames.length} form{formNames.length !== 1 ? 's' : ''} found
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className='w-full'
          >
            <TabsList className='inline-flex h-9 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto'>
              {formNames.length > 0 ? (
                formNames.map(formName => (
                  <TabsTrigger
                    key={formName}
                    value={formName}
                    className='inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
                  >
                    {formName}
                  </TabsTrigger>
                ))
              ) : (
                <TabsTrigger
                  value='legacy'
                  disabled
                  className='inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
                >
                  No forms found
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={activeTab || 'default'} className='space-y-4'>
              {/* Filters */}
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Search</label>
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Search by name, email, or phone...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} size='sm'>
                        <Search className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  {/* Removed status filter as we no longer use status system */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Lead Source</label>
                    <Select
                      value={filters.lead_source || 'all'}
                      onValueChange={value =>
                        handleFilterChange(
                          'lead_source',
                          value === 'all' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All sources' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All sources</SelectItem>
                        <SelectItem value='paid'>Paid (Campaign)</SelectItem>
                        <SelectItem value='non_paid'>
                          Non-Paid (Organic)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Professional Status
                    </label>
                    <Select
                      value={filters.professional_status || 'all'}
                      onValueChange={value =>
                        handleFilterChange(
                          'professional_status',
                          value === 'all' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All types' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All types</SelectItem>
                        <SelectItem value='student'>Student</SelectItem>
                        <SelectItem value='A Working Professional'>
                          Working Professional
                        </SelectItem>
                        <SelectItem value='In Between Jobs'>
                          In Between Jobs
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Relocation</label>
                    <Select
                      value={filters.relocation_possible || 'all'}
                      onValueChange={value =>
                        handleFilterChange(
                          'relocation_possible',
                          value === 'all' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All options' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All options</SelectItem>
                        <SelectItem value='Yes'>Yes</SelectItem>
                        <SelectItem value='No'>No</SelectItem>
                        <SelectItem value='Maybe'>Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deleted Enquiries Toggle */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='show-deleted-tab'
                      checked={showDeleted}
                      onCheckedChange={setShowDeleted}
                    />
                    <Label htmlFor='show-deleted-tab' className='text-sm'>
                      Show Deleted Enquiries
                    </Label>
                  </div>
                  <Button variant='outline' onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Enquiries Table */}
              <div className='space-y-4'>
                {loading ? (
                  <div className='space-y-4'>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className='flex items-center space-x-4'>
                        <Skeleton className='h-12 w-12 rounded-full' />
                        <div className='space-y-2'>
                          <Skeleton className='h-4 w-[250px]' />
                          <Skeleton className='h-4 w-[200px]' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-12'>
                            <Checkbox
                              checked={
                                enquiries.length > 0 &&
                                selectedEnquiries.size === enquiries.length
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label='Select all enquiries'
                            />
                          </TableHead>
                          {visibleColumns.map(column => {
                            const columnLabels = {
                              name: 'Name',
                              contact: 'Contact',
                              professional_status: 'Professional Status',
                              location: 'Location',
                              relocation: 'Relocation',
                              investment: 'Investment',
                              gender: 'Gender',
                              career_goals: 'Career Goals',
                              course_of_interest: 'Course Interest',
                              utm_info: 'Campaign Info',
                              age: 'Age',
                              created: 'Created',
                              actions: 'Actions',
                            };
                            return (
                              <TableHead key={column}>
                                {
                                  columnLabels[
                                    column as keyof typeof columnLabels
                                  ]
                                }
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enquiries.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={visibleColumns.length + 1}
                              className='text-center py-12'
                            >
                              <div className='flex flex-col items-center space-y-4'>
                                <div className='rounded-full bg-muted p-4'>
                                  <MessageCircle className='h-8 w-8 text-muted-foreground' />
                                </div>
                                <div className='space-y-2'>
                                  <h3 className='text-lg font-semibold'>
                                    No enquiries found
                                  </h3>
                                  <p className='text-muted-foreground max-w-sm'>
                                    {Object.keys(filters).length > 0
                                      ? 'No enquiries match your current filters. Try adjusting your search criteria.'
                                      : 'No enquiries have been submitted yet. They will appear here once your website form receives submissions.'}
                                  </p>
                                </div>
                                {Object.keys(filters).length > 0 && (
                                  <Button
                                    variant='outline'
                                    onClick={clearFilters}
                                  >
                                    Clear Filters
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          enquiries.map(enquiry => (
                            <TableRow key={enquiry.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedEnquiries.has(enquiry.id)}
                                  onCheckedChange={checked =>
                                    handleSelectEnquiry(
                                      enquiry.id,
                                      checked as boolean
                                    )
                                  }
                                  aria-label={`Select enquiry from ${enquiry.full_name}`}
                                />
                              </TableCell>
                              {visibleColumns.map(column => (
                                <TableCell key={column}>
                                  {renderTableCell(enquiry, column)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {paginationData && paginationData.totalPages > 1 && (
                <div className='flex items-center justify-between px-2 py-4'>
                  <div className='flex items-center space-x-2'>
                    <p className='text-sm text-muted-foreground'>
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, paginationData.total)}{' '}
                      of {paginationData.total} enquiries
                    </p>
                    <div className='flex items-center space-x-2'>
                      <p className='text-sm text-muted-foreground'>
                        Rows per page:
                      </p>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value =>
                          handlePageSizeChange(Number(value))
                        }
                      >
                        <SelectTrigger className='w-20'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='10'>10</SelectItem>
                          <SelectItem value='25'>25</SelectItem>
                          <SelectItem value='50'>50</SelectItem>
                          <SelectItem value='100'>100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className='flex items-center space-x-1'>
                      {Array.from(
                        { length: Math.min(5, paginationData.totalPages) },
                        (_, i) => {
                          const pageNum =
                            Math.max(
                              1,
                              Math.min(
                                paginationData.totalPages - 4,
                                currentPage - 2
                              )
                            ) + i;
                          if (pageNum > paginationData.totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? 'default' : 'outline'
                              }
                              size='sm'
                              onClick={() => handlePageChange(pageNum)}
                              className='w-8 h-8 p-0'
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Default content when no tab is selected - shows all enquiries */}
            <TabsContent value='default' className='space-y-4'>
              {/* Filters */}
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Search</label>
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Search by name, email, or phone...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} size='sm'>
                        <Search className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  {/* Removed status filter as we no longer use status system */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Lead Source</label>
                    <Select
                      value={filters.lead_source || 'all'}
                      onValueChange={value =>
                        handleFilterChange(
                          'lead_source',
                          value === 'all' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All sources' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All sources</SelectItem>
                        <SelectItem value='paid'>Paid (Campaign)</SelectItem>
                        <SelectItem value='non_paid'>
                          Non-Paid (Organic)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Professional Status
                    </label>
                    <Select
                      value={filters.professional_status || 'all'}
                      onValueChange={value =>
                        handleFilterChange(
                          'professional_status',
                          value === 'all' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All types' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All types</SelectItem>
                        <SelectItem value='student'>Student</SelectItem>
                        <SelectItem value='A Working Professional'>
                          Working Professional
                        </SelectItem>
                        <SelectItem value='In Between Jobs'>
                          In Between Jobs
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Relocation</label>
                    <Select
                      value={filters.relocation_possible || 'all'}
                      onValueChange={value =>
                        handleFilterChange(
                          'relocation_possible',
                          value === 'all' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All options' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All options</SelectItem>
                        <SelectItem value='Yes'>Yes</SelectItem>
                        <SelectItem value='No'>No</SelectItem>
                        <SelectItem value='Maybe'>Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deleted Enquiries Toggle */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='show-deleted'
                      checked={showDeleted}
                      onCheckedChange={setShowDeleted}
                    />
                    <Label htmlFor='show-deleted' className='text-sm'>
                      Show Deleted Enquiries
                    </Label>
                  </div>
                  <Button variant='outline' onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Enquiries Table */}
              <div className='space-y-4'>
                {loading ? (
                  <div className='space-y-4'>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className='flex items-center space-x-4'>
                        <Skeleton className='h-12 w-12 rounded-full' />
                        <div className='space-y-2'>
                          <Skeleton className='h-4 w-[250px]' />
                          <Skeleton className='h-4 w-[200px]' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-12'>
                            <Checkbox
                              checked={
                                enquiries.length > 0 &&
                                selectedEnquiries.size === enquiries.length
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label='Select all enquiries'
                            />
                          </TableHead>
                          {visibleColumns.map(column => {
                            const columnLabels = {
                              name: 'Name',
                              contact: 'Contact',
                              professional_status: 'Professional Status',
                              location: 'Location',
                              relocation: 'Relocation',
                              investment: 'Investment',
                              gender: 'Gender',
                              career_goals: 'Career Goals',
                              course_of_interest: 'Course Interest',
                              utm_info: 'Campaign Info',
                              age: 'Age',
                              created: 'Created',
                              actions: 'Actions',
                            };
                            return (
                              <TableHead key={column}>
                                {
                                  columnLabels[
                                    column as keyof typeof columnLabels
                                  ]
                                }
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enquiries.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={visibleColumns.length + 1}
                              className='text-center py-12'
                            >
                              <div className='flex flex-col items-center space-y-4'>
                                <div className='rounded-full bg-muted p-4'>
                                  <MessageCircle className='h-8 w-8 text-muted-foreground' />
                                </div>
                                <div className='space-y-2'>
                                  <h3 className='text-lg font-semibold'>
                                    No enquiries found
                                  </h3>
                                  <p className='text-muted-foreground max-w-sm'>
                                    {Object.keys(filters).length > 0
                                      ? 'No enquiries match your current filters. Try adjusting your search criteria.'
                                      : 'No enquiries have been submitted yet. They will appear here once your website form receives submissions.'}
                                  </p>
                                </div>
                                {Object.keys(filters).length > 0 && (
                                  <Button
                                    variant='outline'
                                    onClick={clearFilters}
                                  >
                                    Clear Filters
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          enquiries.map(enquiry => (
                            <TableRow key={enquiry.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedEnquiries.has(enquiry.id)}
                                  onCheckedChange={checked =>
                                    handleSelectEnquiry(
                                      enquiry.id,
                                      checked as boolean
                                    )
                                  }
                                  aria-label={`Select enquiry from ${enquiry.full_name}`}
                                />
                              </TableCell>
                              {visibleColumns.map(column => (
                                <TableCell key={column}>
                                  {renderTableCell(enquiry, column)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {paginationData && paginationData.totalPages > 1 && (
                <div className='flex items-center justify-between px-2 py-4'>
                  <div className='flex items-center space-x-2'>
                    <p className='text-sm text-muted-foreground'>
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, paginationData.total)}{' '}
                      of {paginationData.total} enquiries
                    </p>
                    <div className='flex items-center space-x-2'>
                      <p className='text-sm text-muted-foreground'>
                        Rows per page:
                      </p>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value =>
                          handlePageSizeChange(Number(value))
                        }
                      >
                        <SelectTrigger className='w-20'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='10'>10</SelectItem>
                          <SelectItem value='25'>25</SelectItem>
                          <SelectItem value='50'>50</SelectItem>
                          <SelectItem value='100'>100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className='flex items-center space-x-1'>
                      {Array.from(
                        { length: Math.min(5, paginationData.totalPages) },
                        (_, i) => {
                          const pageNum =
                            Math.max(
                              1,
                              Math.min(
                                paginationData.totalPages - 4,
                                currentPage - 2
                              )
                            ) + i;
                          if (pageNum > paginationData.totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? 'default' : 'outline'
                              }
                              size='sm'
                              onClick={() => handlePageChange(pageNum)}
                              className='w-8 h-8 p-0'
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  );
}
