import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarIcon,
  Clock,
  User,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { EquipmentReturn } from '@/domains/equipment/types';
import { EquipmentConditionBadge } from '@/domains/equipment/components/ui/EquipmentConditionBadge';

interface ReturnHistoryDialogProps {
  equipmentId: string;
  equipmentName: string;
  returns: EquipmentReturn[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONDITION_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  poor: 'bg-orange-100 text-orange-800',
  damaged: 'bg-red-100 text-red-800',
};

export function ReturnHistoryDialog({
  equipmentId,
  equipmentName,
  returns,
  open,
  onOpenChange,
}: ReturnHistoryDialogProps) {
  const getOverdueBadge = (overdueDays: number) => {
    if (overdueDays === 0) return null;
    return (
      <Badge variant='destructive' className='flex items-center gap-1'>
        <AlertTriangle className='h-3 w-3' />
        {overdueDays} day(s) late
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Return History - {equipmentName}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Return Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>{returns.length}</div>
                  <div className='text-sm text-muted-foreground'>
                    Total Returns
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {
                      returns.filter(
                        r =>
                          r.condition === 'excellent' || r.condition === 'good'
                      ).length
                    }
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Good Condition
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {returns.filter(r => r.condition === 'poor').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Poor Condition
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-600'>
                    {returns.filter(r => r.condition === 'damaged').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Damaged</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return History Table */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Return Records</CardTitle>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No return history found for this equipment.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Processed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map(returnRecord => (
                      <TableRow key={returnRecord.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                            {returnRecord.returned_at
                              ? format(
                                  new Date(returnRecord.returned_at),
                                  'MMM dd, yyyy'
                                )
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground' />
                            <span>
                              {returnRecord.borrowing?.student?.name ||
                                'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <EquipmentConditionBadge
                            condition={returnRecord.condition}
                          />
                        </TableCell>
                        <TableCell>
                          {getOverdueBadge(returnRecord.overdue_days)}
                        </TableCell>
                        <TableCell>
                          <div className='max-w-xs truncate'>
                            {returnRecord.notes || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground' />
                            <span>
                              {returnRecord.processed_by_user?.full_name ||
                                'System'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
