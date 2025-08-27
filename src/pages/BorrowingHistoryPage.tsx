import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  CalendarIcon,
  Clock,
  Package,
  User,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useBorrowings,
  useOverdueBorrowings,
} from '@/hooks/equipment/useEquipment';
import { useEquipmentPermissions } from '@/hooks/equipment/useEquipmentPermissions';
import { useCohorts } from '@/hooks/useCohorts';
import {
  ReturnEquipmentDialog,
  EmptyBorrowingState,
  BorrowingHistorySkeleton,
} from '@/components/equipment';
import {
  DeleteBorrowingDialog,
  BlacklistStudentDialog,
} from '@/components/equipment/dialogs';
import { EquipmentBorrowing } from '@/types/equipment';
import DashboardShell from '@/components/DashboardShell';

export default function BorrowingHistoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    student_id: '',
    equipment_id: '',
    status: '',
    cohort_id: 'all',
    date_from: '',
    date_to: '',
    isOverdue: false,
  });

  const {
    data: borrowingsData,
    isLoading,
    error: borrowingsError,
    refetch,
  } = useBorrowings(page, 10, filters);
  const { data: overdueBorrowings, error: overdueError } =
    useOverdueBorrowings();
  const { cohorts } = useCohorts();
  const { canManageBlacklist } = useEquipmentPermissions();

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] =
    useState<EquipmentBorrowing | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [borrowingToDelete, setBorrowingToDelete] =
    useState<EquipmentBorrowing | null>(null);

  // Blacklist dialog state
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);

  const getStatusBadge = (
    status: string,
    expectedReturnDate: string,
    equipment?: any
  ) => {
    const isOverdue = expectedReturnDate
      ? (() => {
          // Get today's date only (without time) for consistent comparison
          const today = new Date().toISOString().split('T')[0];
          const expectedDateOnly = expectedReturnDate.split('T')[0];
          return expectedDateOnly < today;
        })()
      : false;

    // Check equipment status first (lost, damaged, etc.)
    if (equipment?.availability_status === 'lost') {
      return <Badge variant='destructive'>Lost</Badge>;
    }

    if (equipment?.condition_status === 'damaged') {
      return <Badge variant='destructive'>Damaged</Badge>;
    }

    // Then check borrowing status
    switch (status) {
      case 'active':
        return isOverdue ? (
          <Badge variant='destructive'>Overdue</Badge>
        ) : (
          <Badge variant='default'>Active</Badge>
        );
      case 'returned':
        return <Badge variant='secondary'>Returned</Badge>;
      case 'cancelled':
        return <Badge variant='outline'>Cancelled</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getConditionBadgeVariant = (condition?: string) => {
    if (!condition) return 'outline';

    switch (condition) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';

      case 'poor':
        return 'destructive';
      case 'damaged':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'overdue') {
      // Don't set status filter for overdue - we'll handle this in the service
      setFilters(prev => ({ ...prev, status: '', isOverdue: true }));
    } else if (value === 'active') {
      setFilters(prev => ({ ...prev, status: 'active', isOverdue: false }));
    } else if (value === 'returned') {
      setFilters(prev => ({ ...prev, status: 'returned', isOverdue: false }));
    } else {
      setFilters(prev => ({ ...prev, status: '', isOverdue: false }));
    }
    setPage(1);
  };

  const handleReturnClick = (borrowing: EquipmentBorrowing) => {
    setSelectedBorrowing(borrowing);
    setReturnDialogOpen(true);
  };

  const handleDeleteClick = (borrowing: EquipmentBorrowing) => {
    setBorrowingToDelete(borrowing);
    setDeleteDialogOpen(true);
  };

  const handleReturnSuccess = () => {
    refetch();
    if (overdueBorrowings) {
      // Refetch overdue borrowings as well
      // This would need to be implemented in the hook
    }
  };

  const handleDeleteSuccess = () => {
    refetch();
    setBorrowingToDelete(null);
  };

  const totalPages = Math.ceil((borrowingsData?.total || 0) / 10);

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Borrowing History</h1>
            <p className='text-muted-foreground'>
              Track equipment borrowing and returns
            </p>
          </div>
          <Button
            variant='outline'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Borrowings
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {borrowingsData?.total || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Borrowings
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {borrowingsData?.borrowings?.filter(b => b.status === 'active')
                  .length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Overdue Items
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {overdueBorrowings?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Returned Items
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {borrowingsData?.borrowings?.filter(
                  b => b.status === 'returned'
                ).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            <h3 className='text-lg font-semibold'>Filters</h3>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <Label htmlFor='search'>Search</Label>
              <Input
                id='search'
                placeholder='Search by student or equipment...'
                value={filters.student_id}
                onChange={e =>
                  setFilters(prev => ({ ...prev, student_id: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor='cohort'>Cohort</Label>
              <Select
                value={filters.cohort_id}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, cohort_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select cohort' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Cohorts</SelectItem>
                  {cohorts?.map(cohort => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='date-from'>From Date</Label>
              <Input
                id='date-from'
                type='date'
                value={filters.date_from}
                onChange={e =>
                  setFilters(prev => ({ ...prev, date_from: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor='date-to'>To Date</Label>
              <Input
                id='date-to'
                type='date'
                value={filters.date_to}
                onChange={e =>
                  setFilters(prev => ({ ...prev, date_to: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='space-y-4'
        >
          <div className='flex items-center justify-between'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='all'>All</TabsTrigger>
              <TabsTrigger value='active'>Active</TabsTrigger>
              <TabsTrigger value='overdue'>Overdue</TabsTrigger>
              <TabsTrigger value='returned'>Returned</TabsTrigger>
            </TabsList>

            {canManageBlacklist && (
              <Button
                variant='outline'
                onClick={() => setBlacklistDialogOpen(true)}
                className='flex items-center gap-2 ml-4'
              >
                <AlertTriangle className='h-4 w-4' />
                Manage Blacklist
              </Button>
            )}
          </div>

          <TabsContent value={activeTab} className='space-y-4'>
            {isLoading ? (
              <BorrowingHistorySkeleton />
            ) : borrowingsError ? (
              <Card>
                <CardContent className='text-center py-8 text-red-500'>
                  Error loading borrowing history: {borrowingsError.message}
                </CardContent>
              </Card>
            ) : !borrowingsData?.borrowings ||
              borrowingsData.borrowings.length === 0 ? (
              <EmptyBorrowingState
                tabType={activeTab as 'all' | 'active' | 'overdue' | 'returned'}
                onRefresh={refetch}
                isLoading={isLoading}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Borrowing Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Borrowed Date</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Issue Condition</TableHead>
                        <TableHead>Return Condition</TableHead>
                        <TableHead>Actual Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {borrowingsData?.borrowings?.map(borrowing => (
                        <TableRow key={borrowing.id}>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Package className='h-4 w-4 text-muted-foreground' />
                              <div>
                                <div className='font-medium'>
                                  {borrowing.equipment?.name}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  {borrowing.equipment?.category?.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <User className='h-4 w-4 text-muted-foreground' />
                              <span>
                                {borrowing.student?.first_name &&
                                borrowing.student?.last_name
                                  ? `${borrowing.student.first_name} ${borrowing.student.last_name}`
                                  : borrowing.student?.email ||
                                    'Unknown Student'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                              {borrowing.borrowed_at
                                ? format(
                                    new Date(borrowing.borrowed_at),
                                    'MMM dd, yyyy'
                                  )
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Clock className='h-4 w-4 text-muted-foreground' />
                              {borrowing.expected_return_date
                                ? format(
                                    new Date(borrowing.expected_return_date),
                                    'MMM dd, yyyy'
                                  )
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <CheckCircle className='h-4 w-4 text-muted-foreground' />
                              <Badge
                                variant={getConditionBadgeVariant(
                                  borrowing.issue_condition
                                )}
                              >
                                {borrowing.issue_condition
                                  ? borrowing.issue_condition
                                      .replace('_', ' ')
                                      .toUpperCase()
                                  : 'N/A'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <CheckCircle className='h-4 w-4 text-muted-foreground' />
                              <Badge
                                variant={getConditionBadgeVariant(
                                  borrowing.return_condition
                                )}
                              >
                                {borrowing.return_condition
                                  ? borrowing.return_condition
                                      .replace('_', ' ')
                                      .toUpperCase()
                                  : 'N/A'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                              {borrowing.actual_return_date
                                ? format(
                                    new Date(borrowing.actual_return_date),
                                    'MMM dd, yyyy HH:mm'
                                  )
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(
                              borrowing.status,
                              borrowing.expected_return_date,
                              borrowing.equipment
                            )}
                          </TableCell>
                          <TableCell>
                            {borrowing.status === 'active' &&
                              borrowing.equipment?.availability_status !==
                                'lost' &&
                              borrowing.equipment?.condition_status !==
                                'damaged' && (
                                <>
                                  <Button
                                    size='sm'
                                    onClick={() => handleReturnClick(borrowing)}
                                  >
                                    Return
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    onClick={() => handleDeleteClick(borrowing)}
                                    className='ml-2'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </>
                              )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination className='mt-4'>
                      <PaginationContent>
                        <PaginationItem>
                          {page > 1 ? (
                            <PaginationPrevious
                              onClick={() =>
                                setPage(prev => Math.max(1, prev - 1))
                              }
                            />
                          ) : (
                            <PaginationPrevious className='pointer-events-none opacity-50' />
                          )}
                        </PaginationItem>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map(pageNum => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          {page < totalPages ? (
                            <PaginationNext
                              onClick={() =>
                                setPage(prev => Math.min(totalPages, prev + 1))
                              }
                            />
                          ) : (
                            <PaginationNext className='pointer-events-none opacity-50' />
                          )}
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Return Equipment Dialog */}
        <ReturnEquipmentDialog
          borrowing={selectedBorrowing}
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          onSuccess={handleReturnSuccess}
        />
        {/* Delete Borrowing Dialog */}
        <DeleteBorrowingDialog
          borrowing={borrowingToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />

        {/* Blacklist Student Dialog */}
        <BlacklistStudentDialog
          open={blacklistDialogOpen}
          onOpenChange={setBlacklistDialogOpen}
        />
      </div>
    </DashboardShell>
  );
}
