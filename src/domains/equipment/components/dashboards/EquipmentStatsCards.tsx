import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Package, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface EquipmentStats {
  total: number;
  available: number;
  borrowed: number;
  maintenance: number;
  overdue: number;
}

interface EquipmentStatsCardsProps {
  stats: EquipmentStats;
}

export const EquipmentStatsCards: React.FC<EquipmentStatsCardsProps> = ({
  stats,
}) => {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Equipment</CardTitle>
          <Package className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.total || 0}</div>
          <p className='text-xs text-muted-foreground'>Items in inventory</p>
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
          <div className='text-2xl font-bold'>{stats.borrowed || 0}</div>
          <p className='text-xs text-muted-foreground'>Items out on loan</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Under Maintenance
          </CardTitle>
          <AlertTriangle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.maintenance || 0}</div>
          <p className='text-xs text-muted-foreground'>Under maintenance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Available</CardTitle>
          <CheckCircle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.available || 0}</div>
          <p className='text-xs text-muted-foreground'>Ready to borrow</p>
        </CardContent>
      </Card>
    </div>
  );
};
