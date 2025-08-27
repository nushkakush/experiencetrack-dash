import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Equipment } from '../../types';
import { useEquipmentById } from '../../hooks/useEquipmentQueries';
import { useEquipmentDamageReports } from '../../hooks/useEquipmentDamage';
import { EquipmentDetailsTab } from './EquipmentDetailsTab';
import { BorrowingHistoryTab } from './BorrowingHistoryTab';
import { DamageReportsTab } from './DamageReportsTab';

interface ViewEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string | null;
}

export const ViewEquipmentDialog: React.FC<ViewEquipmentDialogProps> = ({
  open,
  onOpenChange,
  equipmentId,
}) => {
  const [activeTab, setActiveTab] = useState('details');

  const {
    data: equipment,
    isLoading,
    error,
  } = useEquipmentById(equipmentId || '');
  const {
    data: damageReports = [],
    isLoading: damageReportsLoading,
    error: damageReportsError,
  } = useEquipmentDamageReports(equipmentId || '');

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Error Loading Equipment</DialogTitle>
          </DialogHeader>
          <div className='text-center p-6'>
            <p className='text-red-600'>
              Failed to load equipment details: {error.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Equipment Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-32 w-full' />
          </div>
        ) : equipment ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='details'>Equipment Details</TabsTrigger>
              <TabsTrigger value='borrowing'>Borrowing History</TabsTrigger>
              <TabsTrigger value='damage'>Damage/Loss Reports</TabsTrigger>
            </TabsList>

            <TabsContent value='details' className='space-y-6'>
              <EquipmentDetailsTab equipment={equipment} />
            </TabsContent>

            <TabsContent value='borrowing' className='space-y-6'>
              <BorrowingHistoryTab equipment={equipment} />
            </TabsContent>

            <TabsContent value='damage' className='space-y-6'>
              <DamageReportsTab
                damageReports={damageReports}
                isLoading={damageReportsLoading}
                error={damageReportsError}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className='text-center p-6'>
            <p className='text-muted-foreground'>Equipment not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
