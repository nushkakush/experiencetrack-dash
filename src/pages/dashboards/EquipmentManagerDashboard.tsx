import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { Package, Clock, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddEquipmentDialog from '@/components/equipment/AddEquipmentDialog';
import { useEquipmentStats } from '@/domains/equipment/hooks/useEquipmentQueries';
import { Equipment } from '@/domains/equipment/types';
import { WithFeatureFlag } from '@/lib/feature-flags/FeatureFlagProvider';

const EquipmentManagerDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );

  const { data: stats } = useEquipmentStats();

  const handleAddEquipment = () => {
    setShowAddDialog(true);
  };

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Equipment Management
            </h1>
            <p className='text-muted-foreground'>
              Manage equipment inventory and student borrowing
            </p>
          </div>
          <WithFeatureFlag flagId='equipment-create-super-admin-only'>
            <Button onClick={handleAddEquipment}>
              <Plus className='mr-2 h-4 w-4' />
              Add Equipment
            </Button>
          </WithFeatureFlag>
        </div>

        {/* Overview Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Equipment
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.total || 0}</div>
              <p className='text-xs text-muted-foreground'>
                Items in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Currently Borrowed
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.borrowed || 0}</div>
              <p className='text-xs text-muted-foreground'>Items out on loan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Overdue Items
              </CardTitle>
              <AlertTriangle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats?.maintenance || 0}
              </div>
              <p className='text-xs text-muted-foreground'>Under maintenance</p>
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
        </div>
      </div>

      {/* Add Equipment Dialog */}
      <AddEquipmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </DashboardShell>
  );
};

export default EquipmentManagerDashboard;
