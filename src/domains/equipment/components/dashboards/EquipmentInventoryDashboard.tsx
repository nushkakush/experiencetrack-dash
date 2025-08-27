import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Equipment } from '../../types';
import { useEquipment } from '../../hooks/useEquipmentQueries';
import {
  useMarkEquipmentAsLost,
  useMarkEquipmentAsDamaged,
  useMarkEquipmentAsActive,
  useMarkEquipmentAsRetired,
} from '../../hooks/useEquipmentActions';
import { EquipmentFilters } from '../../hooks/useEquipmentFilters';
import { useEquipmentFilters } from '../../hooks/useEquipmentFilters';
import { EquipmentStatsCards } from './EquipmentStatsCards';
import { EquipmentActions } from './EquipmentActions';
import { EquipmentTable } from '../tables/EquipmentTable';
import { MarkEquipmentStatusDialog } from '../dialogs/MarkEquipmentStatusDialog';
import { ReportDamageLossDialog } from '../dialogs/ReportDamageLossDialog';

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

export const EquipmentInventoryDashboard: React.FC<
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

  // Use custom filter hook
  const { activeTab, setActiveTab, filteredEquipment, getFilteredCount } =
    useEquipmentFilters(equipmentData?.equipment);

  const handleStatusAction = async (
    equipment: Equipment,
    action: 'lost' | 'damaged' | 'active' | 'retired'
  ) => {
    setSelectedEquipment(equipment);
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const confirmStatusAction = async () => {
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

  const handleReportDamageLoss = (equipment: Equipment) => {
    setEquipmentToReport(equipment);
    setReportDamageLossDialogOpen(true);
  };

  if (error) {
    return (
      <div className='text-center p-6'>
        <p className='text-red-600'>
          Failed to load equipment: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Equipment Inventory
          </h1>
          <p className='text-muted-foreground'>
            Manage and track equipment status and availability
          </p>
        </div>
        <EquipmentActions
          onAddEquipment={onAddEquipment}
          onIssueEquipment={onIssueEquipment}
          onReportDamageLoss={() => handleReportDamageLoss({} as Equipment)}
        />
      </div>

      {/* Stats Cards */}
      <EquipmentStatsCards
        stats={{
          total: equipmentData?.total || 0,
          available: getFilteredCount('available'),
          borrowed: getFilteredCount('borrowed'),
          maintenance: getFilteredCount('maintenance'),
          overdue: 0, // This would need to be calculated from borrowings
        }}
      />

      {/* Equipment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='available'>
            Available ({getFilteredCount('available')})
          </TabsTrigger>
          <TabsTrigger value='borrowed'>
            Borrowed ({getFilteredCount('borrowed')})
          </TabsTrigger>
          <TabsTrigger value='maintenance'>
            Maintenance ({getFilteredCount('maintenance')})
          </TabsTrigger>
          <TabsTrigger value='retired'>
            Retired ({getFilteredCount('retired')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='space-y-4'>
          <EquipmentTable
            equipment={filteredEquipment}
            isLoading={isLoading}
            onEditEquipment={onEditEquipment}
            onViewEquipment={onViewEquipment}
            onDeleteEquipment={onDeleteEquipment}
            onStatusAction={handleStatusAction}
            onReportDamageLoss={handleReportDamageLoss}
            userRole={userRole}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MarkEquipmentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        equipment={selectedEquipment}
        action={statusAction}
        onConfirm={confirmStatusAction}
        isLoading={
          markAsLostMutation.isPending ||
          markAsDamagedMutation.isPending ||
          markAsActiveMutation.isPending ||
          markAsRetiredMutation.isPending
        }
      />

      <ReportDamageLossDialog
        open={reportDamageLossDialogOpen}
        onOpenChange={setReportDamageLossDialogOpen}
        equipment={equipmentToReport}
      />
    </div>
  );
};
