import React, { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Package,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Trash2,
  AlertOctagon,
  RotateCcw,
  Copy,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Equipment } from '@/types/equipment';
import { useEquipment } from '@/hooks/equipment/useEquipment';
import {
  useMarkEquipmentAsLost,
  useMarkEquipmentAsDamaged,
  useMarkEquipmentAsActive,
  useMarkEquipmentAsRetired,
} from '@/hooks/equipment/useEquipmentActions';
import { EquipmentFilters } from './EquipmentFilterDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MarkEquipmentStatusDialog } from './dialogs/MarkEquipmentStatusDialog';
import { WithFeatureFlag } from '@/lib/feature-flags/FeatureFlagProvider';
import { ReportDamageLossDialog } from './ReportDamageLossDialog';

// Function to copy public link to clipboard
const copyPublicLink = async () => {
  const publicLink = `${window.location.origin}/public/equipment/issue`;
  try {
    await navigator.clipboard.writeText(publicLink);
    toast.success('Public link copied to clipboard!');
  } catch (error) {
    toast.error('Failed to copy link to clipboard');
  }
};

interface EquipmentInventoryDashboardProps {
  onAddEquipment: () => void;
  onEditEquipment: (equipment: Equipment) => void;
  onViewEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (equipment: Equipment) => void;
  onIssueEquipment: () => void;
  filters?: EquipmentFilters;
  searchQuery?: string;
  userRole?: string;
}

// Equipment Table Component
interface EquipmentTableProps {
  equipment: Equipment[];
  isLoading: boolean;
  showBorrower: boolean;
  activeTab: string;
  onEditEquipment: (equipment: Equipment) => void;
  onViewEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (equipment: Equipment) => void;
  onAddEquipment: () => void;
  onIssueEquipment: () => void;
  onReportDamageLoss: (equipment: Equipment) => void;
  onMarkAsLost?: (equipment: Equipment) => void;
  onMarkAsDamaged?: (equipment: Equipment) => void;
  onMarkAsActive?: (equipment: Equipment) => void;
  onMarkAsRetired?: (equipment: Equipment) => void;
  getStatusBadgeVariant: (status: string) => string;
  getConditionBadgeVariant: (condition: string) => string;
  userRole?: string;
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipment,
  isLoading,
  showBorrower,
  activeTab,
  onEditEquipment,
  onViewEquipment,
  onDeleteEquipment,
  onAddEquipment,
  onIssueEquipment,
  onReportDamageLoss,
  onMarkAsLost,
  onMarkAsDamaged,
  onMarkAsActive,
  onMarkAsRetired,
  getStatusBadgeVariant,
  getConditionBadgeVariant,
  userRole,
}) => {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className='flex items-center space-x-4'>
            <Skeleton className='h-12 w-12 rounded' />
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-6 w-16' />
            <Skeleton className='h-6 w-16' />
            {showBorrower && <Skeleton className='h-4 w-24' />}
            <Skeleton className='h-8 w-8' />
          </div>
        ))}
      </div>
    );
  }

  if (equipment.length === 0) {
    const getEmptyStateMessage = () => {
      switch (activeTab) {
        case 'available':
          return {
            title: 'No Available Equipment',
            description:
              'All equipment is currently borrowed, damaged, or unavailable.',
            icon: CheckCircle,
          };
        case 'borrowed':
          return {
            title: 'No Borrowed Equipment',
            description: 'No equipment is currently borrowed by students.',
            icon: Clock,
          };
        case 'damaged':
          return {
            title: 'No Damaged Equipment',
            description: 'Great! All equipment is in good condition.',
            icon: AlertCircle,
          };
        case 'lost':
          return {
            title: 'No Lost Equipment',
            description: 'Excellent! No equipment has been reported as lost.',
            icon: XCircle,
          };
        case 'retired':
          return {
            title: 'No Retired Equipment',
            description: 'No equipment has been decommissioned.',
            icon: XCircle,
          };
        default:
          return {
            title: 'No Equipment Found',
            description: 'No equipment matches the current filters.',
            icon: Package,
          };
      }
    };

    const emptyState = getEmptyStateMessage();
    const IconComponent = emptyState.icon;

    return (
      <div className='text-center py-12'>
        <div className='text-muted-foreground'>
          <IconComponent className='mx-auto h-16 w-16 mb-4 opacity-50' />
          <h3 className='text-lg font-semibold mb-2'>{emptyState.title}</h3>
          <p className='text-sm max-w-md mx-auto mb-6'>
            {emptyState.description}
          </p>
          <div className='flex gap-2 justify-center'>
            {activeTab === 'available' && (
              <WithFeatureFlag flagId='equipment-create-super-admin-only'>
                <Button onClick={onAddEquipment}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Equipment
                </Button>
              </WithFeatureFlag>
            )}
            {activeTab === 'borrowed' && (
              <Button variant='outline' onClick={onIssueEquipment}>
                <Package className='mr-2 h-4 w-4' />
                Issue Equipment
              </Button>
            )}
            {activeTab === 'damaged' && (
              <WithFeatureFlag flagId='equipment-create-super-admin-only'>
                <Button variant='outline' onClick={onAddEquipment}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Equipment
                </Button>
              </WithFeatureFlag>
            )}
            {activeTab === 'lost' && (
              <WithFeatureFlag flagId='equipment-create-super-admin-only'>
                <Button variant='outline' onClick={onAddEquipment}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Equipment
                </Button>
              </WithFeatureFlag>
            )}
            {activeTab === 'retired' && (
              <WithFeatureFlag flagId='equipment-create-super-admin-only'>
                <Button variant='outline' onClick={onAddEquipment}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Equipment
                </Button>
              </WithFeatureFlag>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Equipment</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Serial Number</TableHead>
            {showBorrower && <TableHead>Borrower</TableHead>}
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <div className='flex items-center space-x-3'>
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className='h-12 w-12 object-cover rounded border'
                    />
                  ) : (
                    <div className='h-12 w-12 bg-gray-100 rounded border flex items-center justify-center'>
                      <Package className='h-6 w-6 text-gray-400' />
                    </div>
                  )}
                  <div>
                    <div className='font-medium'>{item.name}</div>
                    {item.description && (
                      <div className='text-sm text-muted-foreground truncate max-w-xs'>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{item.category?.name || 'N/A'}</TableCell>
              <TableCell>{item.location?.name || 'N/A'}</TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(item.availability_status)}
                >
                  {item.availability_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={getConditionBadgeVariant(item.condition_status)}
                >
                  {item.condition_status}
                </Badge>
              </TableCell>
              <TableCell>{item.serial_number || 'N/A'}</TableCell>
              {showBorrower && (
                <TableCell>
                  {item.borrowings && item.borrowings.length > 0 ? (
                    <div className='space-y-1'>
                      {item.borrowings
                        .filter(borrowing => borrowing.status === 'active')
                        .map((borrowing, index) => (
                          <div key={borrowing.id} className='text-sm'>
                            <div className='font-medium'>
                              {borrowing.student?.first_name}{' '}
                              {borrowing.student?.last_name}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              Borrowed:{' '}
                              {new Date(
                                borrowing.borrowed_at
                              ).toLocaleDateString()}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              Return:{' '}
                              {new Date(
                                borrowing.expected_return_date
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>
                      No active borrower
                    </span>
                  )}
                </TableCell>
              )}
              <TableCell className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => onViewEquipment(item)}>
                      <Eye className='mr-2 h-4 w-4' />
                      View Details
                    </DropdownMenuItem>
                    {(activeTab === 'damaged' || activeTab === 'lost') && (
                      <DropdownMenuItem
                        onClick={() => onReportDamageLoss(item)}
                      >
                        <AlertTriangle className='mr-2 h-4 w-4' />
                        Report Damage/Loss
                      </DropdownMenuItem>
                    )}
                    {userRole === 'super_admin' && (
                      <DropdownMenuItem onClick={() => onEditEquipment(item)}>
                        <Edit className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                    )}

                    {/* Available and Borrowed tabs - Mark as Lost/Damaged */}
                    {(activeTab === 'available' ||
                      activeTab === 'borrowed') && (
                      <>
                        {onMarkAsLost && (
                          <DropdownMenuItem onClick={() => onMarkAsLost(item)}>
                            <AlertOctagon className='mr-2 h-4 w-4' />
                            Mark as Lost
                          </DropdownMenuItem>
                        )}
                        {onMarkAsDamaged && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsDamaged(item)}
                          >
                            <AlertTriangle className='mr-2 h-4 w-4' />
                            Mark as Damaged
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Lost tab - Mark as Active/Retired */}
                    {activeTab === 'lost' && (
                      <>
                        {onMarkAsActive && userRole === 'super_admin' && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsActive(item)}
                          >
                            <RotateCcw className='mr-2 h-4 w-4' />
                            Mark as Active
                          </DropdownMenuItem>
                        )}
                        {onMarkAsRetired && userRole === 'super_admin' && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsRetired(item)}
                          >
                            <XCircle className='mr-2 h-4 w-4' />
                            Mark as Retired
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Damaged tab - Mark as Active/Retired */}
                    {activeTab === 'damaged' && (
                      <>
                        {onMarkAsActive && userRole === 'super_admin' && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsActive(item)}
                          >
                            <RotateCcw className='mr-2 h-4 w-4' />
                            Mark as Active
                          </DropdownMenuItem>
                        )}
                        {onMarkAsRetired && userRole === 'super_admin' && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsRetired(item)}
                          >
                            <XCircle className='mr-2 h-4 w-4' />
                            Mark as Retired
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Retired tab - Mark as Active only */}
                    {activeTab === 'retired' && (
                      <>
                        {onMarkAsActive && userRole === 'super_admin' && (
                          <DropdownMenuItem
                            onClick={() => onMarkAsActive(item)}
                          >
                            <RotateCcw className='mr-2 h-4 w-4' />
                            Mark as Active
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {userRole === 'super_admin' && (
                      <DropdownMenuItem
                        onClick={() => onDeleteEquipment(item)}
                        className='text-red-600 focus:text-red-600'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const EquipmentInventoryDashboard: React.FC<
  EquipmentInventoryDashboardProps
> = ({
  onAddEquipment,
  onEditEquipment,
  onViewEquipment,
  onDeleteEquipment,
  onIssueEquipment,
  filters = {},
  searchQuery = '',
  userRole = 'student',
}) => {
  const [activeTab, setActiveTab] = useState('available');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [statusAction, setStatusAction] = useState<
    'lost' | 'damaged' | 'active' | 'retired'
  >('lost');
  const [reportDamageLossDialogOpen, setReportDamageLossDialogOpen] =
    useState(false);
  const [equipmentToReport, setEquipmentToReport] = useState<Equipment | null>(
    null
  );

  // Equipment status mutation hooks
  const markAsLostMutation = useMarkEquipmentAsLost();
  const markAsDamagedMutation = useMarkEquipmentAsDamaged();
  const markAsActiveMutation = useMarkEquipmentAsActive();
  const markAsRetiredMutation = useMarkEquipmentAsRetired();

  // Debug logging for search query
  console.log('EquipmentInventoryDashboard - searchQuery:', searchQuery);
  console.log('EquipmentInventoryDashboard - filters:', filters);

  // Fetch all equipment data
  const {
    data: equipmentData,
    isLoading,
    error,
  } = useEquipment(
    1,
    1000,
    searchQuery,
    filters.category_id,
    filters.availability_status
  );

  // Debug logging for equipment data
  console.log('EquipmentInventoryDashboard - equipmentData:', equipmentData);
  console.log('EquipmentInventoryDashboard - isLoading:', isLoading);
  console.log('EquipmentInventoryDashboard - error:', error);

  // Filter equipment based on active tab and additional filters
  const getFilteredEquipment = () => {
    if (!equipmentData?.equipment) return [];

    let equipment = equipmentData.equipment;

    // Apply additional client-side filters
    if (filters.condition_status) {
      equipment = equipment.filter(
        item => item.condition_status === filters.condition_status
      );
    }

    if (filters.location_id) {
      equipment = equipment.filter(
        item => item.location_id === filters.location_id
      );
    }

    if (filters.price_min !== undefined) {
      equipment = equipment.filter(
        item => (item.purchase_cost || 0) >= filters.price_min!
      );
    }

    if (filters.price_max !== undefined) {
      equipment = equipment.filter(
        item => (item.purchase_cost || 0) <= filters.price_max!
      );
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      equipment = equipment.filter(
        item => new Date(item.created_at) >= fromDate
      );
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      equipment = equipment.filter(item => new Date(item.created_at) <= toDate);
    }

    // Apply tab-based filtering
    switch (activeTab) {
      case 'available':
        return equipment.filter(
          item =>
            item.availability_status === 'available' &&
            !['damaged', 'under_repair', 'decommissioned'].includes(
              item.condition_status
            )
        );

      case 'borrowed':
        return equipment.filter(
          item => item.availability_status === 'borrowed'
        );

      case 'damaged':
        return equipment.filter(
          item =>
            (['damaged', 'under_repair'].includes(item.condition_status) ||
              item.availability_status === 'maintenance') &&
            item.availability_status !== 'lost'
        );

      case 'lost':
        return equipment.filter(item => item.availability_status === 'lost');

      case 'retired':
        return equipment.filter(
          item =>
            item.condition_status === 'decommissioned' ||
            item.availability_status === 'decommissioned'
        );

      default:
        return equipment;
    }
  };

  const filteredEquipment = getFilteredEquipment();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default' as const;
      case 'borrowed':
        return 'secondary' as const;
      case 'maintenance':
        return 'destructive' as const;
      case 'retired':
        return 'outline' as const;
      case 'lost':
        return 'destructive' as const;
      case 'decommissioned':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'default' as const;
      case 'good':
        return 'secondary' as const;
      case 'poor':
        return 'destructive' as const;
      case 'damaged':
        return 'destructive' as const;
      case 'under_repair':
        return 'secondary' as const;
      case 'decommissioned':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  const getTabCount = (tab: string) => {
    if (!equipmentData?.equipment) return 0;

    const equipment = equipmentData.equipment;

    switch (tab) {
      case 'available':
        return equipment.filter(
          item =>
            item.availability_status === 'available' &&
            !['damaged', 'under_repair', 'decommissioned'].includes(
              item.condition_status
            )
        ).length;

      case 'borrowed':
        return equipment.filter(item => item.availability_status === 'borrowed')
          .length;

      case 'damaged':
        return equipment.filter(
          item =>
            (['damaged', 'under_repair'].includes(item.condition_status) ||
              item.availability_status === 'maintenance') &&
            item.availability_status !== 'lost'
        ).length;

      case 'lost':
        return equipment.filter(item => item.availability_status === 'lost')
          .length;

      case 'retired':
        return equipment.filter(
          item =>
            item.condition_status === 'decommissioned' ||
            item.availability_status === 'decommissioned'
        ).length;

      default:
        return 0;
    }
  };

  // Status action handlers
  const handleMarkAsLost = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setStatusAction('lost');
    setStatusDialogOpen(true);
  };

  const handleMarkAsDamaged = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setStatusAction('damaged');
    setStatusDialogOpen(true);
  };

  const handleMarkAsActive = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setStatusAction('active');
    setStatusDialogOpen(true);
  };

  const handleMarkAsRetired = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setStatusAction('retired');
    setStatusDialogOpen(true);
  };

  const handleReportDamageLoss = (equipment: Equipment) => {
    setEquipmentToReport(equipment);
    setReportDamageLossDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedEquipment) return;

    try {
      switch (statusAction) {
        case 'lost':
          await markAsLostMutation.mutateAsync(selectedEquipment.id);
          break;
        case 'damaged':
          await markAsDamagedMutation.mutateAsync(selectedEquipment.id);
          break;
        case 'active':
          await markAsActiveMutation.mutateAsync(selectedEquipment.id);
          break;
        case 'retired':
          await markAsRetiredMutation.mutateAsync(selectedEquipment.id);
          break;
      }
      setStatusDialogOpen(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Failed to update equipment status:', error);
    }
  };

  if (error) {
    return (
      <div className='text-center p-6 border border-red-200 rounded-lg bg-red-50'>
        <p className='text-red-600'>
          Failed to load equipment: {error.message}
        </p>
        <Button onClick={() => window.location.reload()} className='mt-4'>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Action Buttons */}
      <div className='flex justify-end gap-2'>
        <WithFeatureFlag flagId='equipment-create-super-admin-only'>
          <Button onClick={onAddEquipment}>
            <Plus className='mr-2 h-4 w-4' />
            Add Equipment
          </Button>
        </WithFeatureFlag>
        <Button variant='outline' onClick={onIssueEquipment}>
          <Package className='mr-2 h-4 w-4' />
          Issue Equipment
        </Button>
        <Button variant='outline' onClick={copyPublicLink}>
          <Copy className='mr-2 h-4 w-4' />
          Copy Public Link
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground'>
          <TabsTrigger
            value='available'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
          >
            Available
            <Badge variant='secondary' className='ml-1 text-xs'>
              {getTabCount('available')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value='borrowed'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
          >
            Borrowed
            <Badge variant='secondary' className='ml-1 text-xs'>
              {getTabCount('borrowed')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value='damaged'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
          >
            Damaged
            <Badge variant='secondary' className='ml-1 text-xs'>
              {getTabCount('damaged')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value='lost'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
          >
            Lost
            <Badge variant='secondary' className='ml-1 text-xs'>
              {getTabCount('lost')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value='retired'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'
          >
            Retired
            <Badge variant='secondary' className='ml-1 text-xs'>
              {getTabCount('retired')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Available Tab */}
        <TabsContent value='available' className='mt-6'>
          <EquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            showBorrower={false}
            activeTab={activeTab}
            onEditEquipment={onEditEquipment}
            onViewEquipment={onViewEquipment}
            onDeleteEquipment={onDeleteEquipment}
            onAddEquipment={onAddEquipment}
            onIssueEquipment={onIssueEquipment}
            onReportDamageLoss={handleReportDamageLoss}
            onMarkAsLost={handleMarkAsLost}
            onMarkAsDamaged={handleMarkAsDamaged}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getConditionBadgeVariant={getConditionBadgeVariant}
            userRole={userRole}
          />
        </TabsContent>

        {/* Borrowed Tab */}
        <TabsContent value='borrowed' className='mt-6'>
          <EquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            showBorrower={true}
            activeTab={activeTab}
            onEditEquipment={onEditEquipment}
            onViewEquipment={onViewEquipment}
            onDeleteEquipment={onDeleteEquipment}
            onAddEquipment={onAddEquipment}
            onIssueEquipment={onIssueEquipment}
            onReportDamageLoss={handleReportDamageLoss}
            onMarkAsLost={handleMarkAsLost}
            onMarkAsDamaged={handleMarkAsDamaged}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getConditionBadgeVariant={getConditionBadgeVariant}
            userRole={userRole}
          />
        </TabsContent>

        {/* Damaged Tab */}
        <TabsContent value='damaged' className='mt-6'>
          <EquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            showBorrower={true}
            activeTab={activeTab}
            onEditEquipment={onEditEquipment}
            onViewEquipment={onViewEquipment}
            onDeleteEquipment={onDeleteEquipment}
            onAddEquipment={onAddEquipment}
            onIssueEquipment={onIssueEquipment}
            onReportDamageLoss={handleReportDamageLoss}
            onMarkAsActive={handleMarkAsActive}
            onMarkAsRetired={handleMarkAsRetired}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getConditionBadgeVariant={getConditionBadgeVariant}
            userRole={userRole}
          />
        </TabsContent>

        {/* Lost Tab */}
        <TabsContent value='lost' className='mt-6'>
          <EquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            showBorrower={true}
            activeTab={activeTab}
            onEditEquipment={onEditEquipment}
            onViewEquipment={onViewEquipment}
            onDeleteEquipment={onDeleteEquipment}
            onAddEquipment={onAddEquipment}
            onIssueEquipment={onIssueEquipment}
            onReportDamageLoss={handleReportDamageLoss}
            onMarkAsActive={handleMarkAsActive}
            onMarkAsRetired={handleMarkAsRetired}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getConditionBadgeVariant={getConditionBadgeVariant}
            userRole={userRole}
          />
        </TabsContent>

        {/* Retired Tab */}
        <TabsContent value='retired' className='mt-6'>
          <EquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            showBorrower={true}
            activeTab={activeTab}
            onEditEquipment={onEditEquipment}
            onViewEquipment={onViewEquipment}
            onDeleteEquipment={onDeleteEquipment}
            onAddEquipment={onAddEquipment}
            onIssueEquipment={onIssueEquipment}
            onReportDamageLoss={handleReportDamageLoss}
            onMarkAsActive={handleMarkAsActive}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getConditionBadgeVariant={getConditionBadgeVariant}
            userRole={userRole}
          />
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      {selectedEquipment && (
        <MarkEquipmentStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          equipmentName={selectedEquipment.name}
          action={statusAction}
          onConfirm={handleStatusConfirm}
          isLoading={
            markAsLostMutation.isPending ||
            markAsDamagedMutation.isPending ||
            markAsActiveMutation.isPending ||
            markAsRetiredMutation.isPending
          }
        />
      )}

      {/* Report Damage/Loss Dialog */}
      {equipmentToReport && (
        <ReportDamageLossDialog
          open={reportDamageLossDialogOpen}
          onOpenChange={setReportDamageLossDialogOpen}
          equipmentId={equipmentToReport.id}
          equipmentName={equipmentToReport.name}
        />
      )}
    </div>
  );
};

export default EquipmentInventoryDashboard;
