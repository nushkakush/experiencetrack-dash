import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Package,
  Calendar,
  User,
  MapPin,
  Tag,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Equipment } from '@/types/equipment';
import {
  useEquipmentById,
  useEquipmentDamageReports,
} from '@/hooks/equipment/useEquipment';
import { Skeleton } from '@/components/ui/skeleton';
import { DamageReportsList } from './DamageReportsList';
import { ReportDamageLossDialog } from './ReportDamageLossDialog';

interface ViewEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string | null;
}

const ViewEquipmentDialog: React.FC<ViewEquipmentDialogProps> = ({
  open,
  onOpenChange,
  equipmentId,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showReportDamageLossDialog, setShowReportDamageLossDialog] =
    useState(false);

  const { data: equipment, isLoading, error } = useEquipmentById(equipmentId);
  const {
    data: damageReports = [],
    isLoading: damageReportsLoading,
    error: damageReportsError,
  } = useEquipmentDamageReports(equipmentId || '');

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
      case 'decommissioned':
        return 'outline';
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
      case 'decommissioned':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

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

            {/* Equipment Details Tab */}
            <TabsContent value='details' className='space-y-6'>
              {/* Equipment Header */}
              <div className='flex items-start space-x-4'>
                {equipment.images && equipment.images.length > 0 ? (
                  <img
                    src={equipment.images[0]}
                    alt={equipment.name}
                    className='h-24 w-24 object-cover rounded-lg border'
                  />
                ) : (
                  <div className='h-24 w-24 bg-gray-100 rounded-lg border flex items-center justify-center'>
                    <Package className='h-12 w-12 text-gray-400' />
                  </div>
                )}
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold'>{equipment.name}</h2>
                  <p className='text-muted-foreground mt-1'>
                    {equipment.description}
                  </p>
                  <div className='flex gap-2 mt-3'>
                    <Badge
                      variant={getStatusBadgeVariant(
                        equipment.availability_status
                      )}
                    >
                      {equipment.availability_status}
                    </Badge>
                    <Badge
                      variant={getConditionBadgeVariant(
                        equipment.condition_status
                      )}
                    >
                      {equipment.condition_status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Equipment Information Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Package className='h-5 w-5' />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Serial Number:
                      </span>
                      <span className='font-medium'>
                        {equipment.serial_number || 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Category:</span>
                      <span className='font-medium'>
                        {equipment.category?.name || 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Location:</span>
                      <span className='font-medium'>
                        {equipment.location?.name || 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Purchase Date:
                      </span>
                      <span className='font-medium'>
                        {equipment.purchase_date
                          ? formatDate(equipment.purchase_date)
                          : 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Purchase Cost:
                      </span>
                      <span className='font-medium'>
                        {equipment.purchase_cost
                          ? formatCurrency(equipment.purchase_cost)
                          : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5' />
                      Status Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Availability:
                      </span>
                      <Badge
                        variant={getStatusBadgeVariant(
                          equipment.availability_status
                        )}
                      >
                        {equipment.availability_status}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Condition:</span>
                      <Badge
                        variant={getConditionBadgeVariant(
                          equipment.condition_status
                        )}
                      >
                        {equipment.condition_status}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Created:</span>
                      <span className='font-medium'>
                        {formatDate(equipment.created_at)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Last Updated:
                      </span>
                      <span className='font-medium'>
                        {formatDate(equipment.updated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Condition Notes */}
              {equipment.condition_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Condition Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground'>
                      {equipment.condition_notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Current Borrower (if borrowed) */}
              {equipment.availability_status === 'borrowed' &&
                equipment.borrowings &&
                equipment.borrowings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <User className='h-5 w-5' />
                        Current Borrower
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {equipment.borrowings
                        .filter(borrowing => borrowing.status === 'active')
                        .map((borrowing, index) => (
                          <div key={borrowing.id} className='space-y-2'>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>
                                Student:
                              </span>
                              <span className='font-medium'>
                                {borrowing.student?.first_name}{' '}
                                {borrowing.student?.last_name}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>
                                Borrowed:
                              </span>
                              <span className='font-medium'>
                                {formatDate(borrowing.borrowed_at)}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>
                                Expected Return:
                              </span>
                              <span className='font-medium'>
                                {formatDate(borrowing.expected_return_date)}
                              </span>
                            </div>
                            {borrowing.reason && (
                              <div className='flex justify-between'>
                                <span className='text-muted-foreground'>
                                  Reason:
                                </span>
                                <span className='font-medium'>
                                  {borrowing.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* Borrowing History Tab */}
            <TabsContent value='borrowing' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    Borrowing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {equipment.borrowings && equipment.borrowings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Borrowed Date</TableHead>
                          <TableHead>Expected Return</TableHead>
                          <TableHead>Issue Condition</TableHead>
                          <TableHead>Return Condition</TableHead>
                          <TableHead>Actual Return</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment.borrowings.map(borrowing => (
                          <TableRow key={borrowing.id}>
                            <TableCell>
                              {borrowing.student?.first_name}{' '}
                              {borrowing.student?.last_name}
                            </TableCell>
                            <TableCell>
                              {formatDate(borrowing.borrowed_at)}
                            </TableCell>
                            <TableCell>
                              {formatDate(borrowing.expected_return_date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getConditionBadgeVariant(
                                  borrowing.issue_condition || ''
                                )}
                              >
                                {borrowing.issue_condition
                                  ? borrowing.issue_condition
                                      .replace('_', ' ')
                                      .toUpperCase()
                                  : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getConditionBadgeVariant(
                                  borrowing.return_condition || ''
                                )}
                              >
                                {borrowing.return_condition
                                  ? borrowing.return_condition
                                      .replace('_', ' ')
                                      .toUpperCase()
                                  : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {borrowing.actual_return_date
                                ? formatDate(borrowing.actual_return_date)
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  equipment.availability_status === 'lost'
                                    ? 'destructive'
                                    : equipment.condition_status === 'damaged'
                                      ? 'destructive'
                                      : borrowing.status === 'active'
                                        ? 'secondary'
                                        : borrowing.status === 'returned'
                                          ? 'default'
                                          : borrowing.status === 'overdue'
                                            ? 'destructive'
                                            : 'outline'
                                }
                              >
                                {equipment.availability_status === 'lost'
                                  ? 'Lost'
                                  : equipment.condition_status === 'damaged'
                                    ? 'Damaged'
                                    : borrowing.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{borrowing.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className='text-center py-8'>
                      <Clock className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>
                        No borrowing history found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Damage Reports Tab */}
            <TabsContent value='damage' className='space-y-6'>
              <DamageReportsList
                reports={damageReports}
                loading={damageReportsLoading}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className='text-center p-6'>
            <p className='text-muted-foreground'>Equipment not found</p>
          </div>
        )}
      </DialogContent>

      <ReportDamageLossDialog
        open={showReportDamageLossDialog}
        onOpenChange={setShowReportDamageLossDialog}
        equipmentId={equipmentId || ''}
        equipmentName={equipment?.name || ''}
      />
    </Dialog>
  );
};

export default ViewEquipmentDialog;
