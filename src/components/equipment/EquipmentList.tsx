import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import {
  useEquipment,
  useCategories,
  useDeleteEquipment,
} from '@/hooks/equipment/useEquipment';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from './dialogs';
import { WithFeatureFlag } from '@/lib/feature-flags/FeatureFlagProvider';

interface EquipmentListProps {
  onEditEquipment: (equipment: Equipment) => void;
  onViewEquipment: (equipment: Equipment) => void;
  onAddEquipment: () => void;
  onCloneEquipment: (equipment: Equipment) => void;
  onIssueEquipment: () => void;
  onReportDamageLoss: (equipment: Equipment) => void;
}

const EquipmentList: React.FC<EquipmentListProps> = ({
  onEditEquipment,
  onViewEquipment,
  onAddEquipment,
  onCloneEquipment,
  onIssueEquipment,
  onReportDamageLoss,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(
    null
  );

  const {
    data: equipmentData,
    isLoading,
    error,
  } = useEquipment(
    page,
    10,
    search,
    categoryFilter === 'all' ? undefined : categoryFilter,
    availabilityFilter === 'all' ? undefined : availabilityFilter
  );

  const { data: categoriesData } = useCategories();
  const deleteEquipment = useDeleteEquipment();

  const handleDelete = async (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;

    try {
      await deleteEquipment.mutateAsync(equipmentToDelete.id);
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete equipment:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'borrowed':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      case 'retired':
        return 'outline';
      case 'lost':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';

      case 'poor':
        return 'destructive';
      case 'damaged':
        return 'destructive';
      case 'under_repair':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>
            <p className='text-red-600'>
              Failed to load equipment: {error.message}
            </p>
            <Button onClick={() => window.location.reload()} className='mt-4'>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Equipment Inventory</CardTitle>
            <CardDescription>
              Manage all equipment items in the system
            </CardDescription>
          </div>
          <div className='flex gap-2'>
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
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className='flex gap-4 mb-6'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search equipment...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='All Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {categoriesData?.categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={availabilityFilter}
            onValueChange={setAvailabilityFilter}
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='All Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='available'>Available</SelectItem>
              <SelectItem value='borrowed'>Borrowed</SelectItem>
              <SelectItem value='maintenance'>Maintenance</SelectItem>
              <SelectItem value='retired'>Retired</SelectItem>
              <SelectItem value='lost'>Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Equipment Table */}
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
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Skeleton className='h-12 w-12 rounded' />
                        <div className='space-y-2'>
                          <Skeleton className='h-4 w-32' />
                          <Skeleton className='h-3 w-24' />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-6 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-6 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <Skeleton className='h-8 w-8 ml-auto' />
                    </TableCell>
                  </TableRow>
                ))
              ) : equipmentData?.equipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-8'>
                    <div className='text-muted-foreground'>
                      <Package className='mx-auto h-12 w-12 mb-4 opacity-50' />
                      <p>No equipment found</p>
                      <p className='text-sm'>
                        Start by adding some equipment to your inventory
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                equipmentData?.equipment.map(equipment => (
                  <TableRow key={equipment.id}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        {equipment.images && equipment.images.length > 0 ? (
                          <img
                            src={equipment.images[0]}
                            alt={equipment.name}
                            className='h-12 w-12 object-cover rounded border'
                          />
                        ) : (
                          <div className='h-12 w-12 bg-gray-100 rounded border flex items-center justify-center'>
                            <Package className='h-6 w-6 text-gray-400' />
                          </div>
                        )}
                        <div>
                          <div className='font-medium'>{equipment.name}</div>
                          {equipment.description && (
                            <div className='text-sm text-muted-foreground truncate max-w-xs'>
                              {equipment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{equipment.category?.name || 'N/A'}</TableCell>
                    <TableCell>{equipment.location?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(
                          equipment.availability_status
                        )}
                      >
                        {equipment.availability_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getConditionBadgeVariant(
                          equipment.condition_status
                        )}
                      >
                        {equipment.condition_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{equipment.serial_number || 'N/A'}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => onViewEquipment(equipment)}
                          >
                            <Eye className='mr-2 h-4 w-4' />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditEquipment(equipment)}
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCloneEquipment(equipment)}
                          >
                            <Copy className='mr-2 h-4 w-4' />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onReportDamageLoss(equipment)}
                          >
                            <AlertTriangle className='mr-2 h-4 w-4' />
                            Report Damage/Loss
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(equipment)}
                            className='text-red-600'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {equipmentData && equipmentData.total > 10 && (
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-muted-foreground'>
              Showing {(page - 1) * 10 + 1} to{' '}
              {Math.min(page * 10, equipmentData.total)} of{' '}
              {equipmentData.total} equipment
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(page + 1)}
                disabled={page * 10 >= equipmentData.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        equipment={equipmentToDelete}
        onConfirm={confirmDelete}
        isLoading={deleteEquipment.isPending}
      />
    </Card>
  );
};

export default EquipmentList;
