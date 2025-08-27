import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { Package, Plus, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EquipmentInventoryDashboard from '@/components/equipment/EquipmentInventoryDashboard';
import AddEquipmentDialog from '@/components/equipment/AddEquipmentDialog';
import { IssueEquipmentDialog } from '@/components/equipment/IssueEquipmentDialog';
import { DeleteEquipmentDialog } from '@/components/equipment/DeleteEquipmentDialog';
import ViewEquipmentDialog from '@/components/equipment/ViewEquipmentDialog';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilterDialog';
import { EquipmentFilterSection } from '@/components/equipment/EquipmentFilterSection';
import {
  useEquipmentStats,
  useEquipmentCategories,
  useEquipmentLocations,
} from '@/domains/equipment/hooks/useEquipmentQueries';
import { Equipment } from '@/domains/equipment/types';
import { useDeleteEquipment } from '@/domains/equipment/hooks/useEquipmentMutations';

const EquipmentInventoryPage = () => {
  const { profile } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [isCloneMode, setIsCloneMode] = useState(false);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const deleteEquipmentMutation = useDeleteEquipment();
  const { data: categories } = useEquipmentCategories();
  const { data: locations } = useEquipmentLocations();

  const { data: stats } = useEquipmentStats();

  const handleAddEquipment = () => {
    setShowAddDialog(true);
  };

  const handleIssueEquipment = () => {
    setShowIssueDialog(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsCloneMode(false);
    setShowAddDialog(true);
  };

  const handleCloneEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsCloneMode(true);
    setShowAddDialog(true);
  };

  const handleViewEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowViewDialog(true);
  };

  const handleDeleteEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async (equipment: Equipment) => {
    try {
      await deleteEquipmentMutation.mutateAsync(equipment.id);
      // Success toast is handled by the mutation hook
    } catch (error) {
      console.error('Delete equipment error:', error);
      if (error instanceof Error) {
        console.log('Showing toast with error message:', error.message);
        toast.error(error.message);
      } else {
        console.log('Showing generic error toast');
        toast.error('Failed to delete equipment. Please try again.');
      }
    }
  };

  const handleApplyFilters = (newFilters: EquipmentFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSearch = (query: string) => {
    console.log(
      'EquipmentInventoryPage - handleSearch called with query:',
      query
    );
    setSearchQuery(query);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Equipment Inventory
            </h1>
            <p className='text-muted-foreground'>
              Manage and track all equipment in the inventory
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.total || 0}</div>
              <p className='text-xs text-muted-foreground'>In inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Available</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.available || 0}</div>
              <p className='text-xs text-muted-foreground'>Ready to borrow</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Categories</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>8</div>
              <p className='text-xs text-muted-foreground'>Different types</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className='flex gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search equipment...'
              className='pl-10'
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <Button variant='outline' onClick={toggleFilters}>
            <Filter className='mr-2 h-4 w-4' />
            Filter
            {Object.keys(filters).length > 0 && (
              <Badge
                variant='secondary'
                className='ml-2 h-5 w-5 rounded-full p-0 text-xs'
              >
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Inline Filter Section */}
        {showFilters && (
          <div className='border rounded-lg p-6 bg-card'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Filter Equipment</h3>
              <Button variant='ghost' size='sm' onClick={toggleFilters}>
                <X className='h-4 w-4' />
              </Button>
            </div>
            <EquipmentFilterSection
              filters={filters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              categories={categories?.categories || []}
              locations={locations?.locations || []}
            />
          </div>
        )}

        {/* Equipment Inventory Dashboard */}
        <EquipmentInventoryDashboard
          onEditEquipment={handleEditEquipment}
          onViewEquipment={handleViewEquipment}
          onDeleteEquipment={handleDeleteEquipment}
          onAddEquipment={handleAddEquipment}
          onIssueEquipment={handleIssueEquipment}
          filters={filters}
          searchQuery={searchQuery}
          userRole={profile?.role}
        />
      </div>

      {/* Add/Edit/Clone Equipment Dialog */}
      <AddEquipmentDialog
        open={showAddDialog}
        onOpenChange={open => {
          setShowAddDialog(open);
          if (!open) {
            setSelectedEquipment(null);
            setIsCloneMode(false);
          }
        }}
        equipment={selectedEquipment}
        isCloneMode={isCloneMode}
      />

      {/* View Equipment Dialog */}
      <ViewEquipmentDialog
        open={showViewDialog}
        onOpenChange={open => {
          setShowViewDialog(open);
          if (!open) {
            setSelectedEquipment(null);
          }
        }}
        equipmentId={selectedEquipment?.id || null}
      />

      {/* Issue Equipment Dialog */}
      <IssueEquipmentDialog
        open={showIssueDialog}
        onOpenChange={setShowIssueDialog}
      />

      {/* Delete Equipment Dialog */}
      <DeleteEquipmentDialog
        open={showDeleteDialog}
        onOpenChange={open => {
          setShowDeleteDialog(open);
          if (!open) {
            setSelectedEquipment(null);
          }
        }}
        equipment={selectedEquipment}
        onConfirm={handleConfirmDelete}
        isLoading={deleteEquipmentMutation.isPending}
      />
    </DashboardShell>
  );
};

export default EquipmentInventoryPage;
