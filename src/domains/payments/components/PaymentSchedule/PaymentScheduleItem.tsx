/**
 * Payment Schedule Item Component
 * Individual row component for payment schedule table
 */

import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, IndianRupee, Eye, Edit, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentScheduleItemData {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  paymentDate?: string;
  verificationStatus?: string;
  semesterNumber?: number;
  installmentNumber?: number;
}

interface PaymentScheduleItemProps {
  item: PaymentScheduleItemData;
  onRecordPayment?: (item: PaymentScheduleItemData) => void;
  onViewDetails?: (item: PaymentScheduleItemData) => void;
  onEditPayment?: (item: PaymentScheduleItemData) => void;
  showActions?: boolean;
}

const statusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pending',
  },
  paid: {
    color: 'bg-green-100 text-green-800',
    label: 'Paid',
  },
  overdue: {
    color: 'bg-red-100 text-red-800',
    label: 'Overdue',
  },
  partially_paid: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Partially Paid',
  },
};

const typeConfig = {
  admission_fee: 'Admission Fee',
  semester_fee: 'Semester Fee',
  installment: 'Installment',
  one_shot: 'One Shot Payment',
  scholarship_adjustment: 'Scholarship Adjustment',
};

export const PaymentScheduleItem: React.FC<PaymentScheduleItemProps> =
  React.memo(
    ({
      item,
      onRecordPayment,
      onViewDetails,
      onEditPayment,
      showActions = true,
    }) => {
      const isOverdue =
        item.status === 'pending' && new Date(item.dueDate) < new Date();
      const actualStatus = isOverdue ? 'overdue' : item.status;
      const config = statusConfig[actualStatus];

      const getItemDescription = () => {
        const baseType =
          typeConfig[item.type as keyof typeof typeConfig] || item.type;

        if (item.semesterNumber) {
          return `${baseType} - Semester ${item.semesterNumber}`;
        }

        if (item.installmentNumber) {
          return `${baseType} - Installment ${item.installmentNumber}`;
        }

        return baseType;
      };

      return (
        <TableRow className={isOverdue ? 'bg-red-50' : ''}>
          <TableCell className='font-medium'>
            <div>
              <div>{getItemDescription()}</div>
              {item.verificationStatus && (
                <div className='text-xs text-muted-foreground mt-1'>
                  Verification: {item.verificationStatus}
                </div>
              )}
            </div>
          </TableCell>

          <TableCell className='font-semibold'>
            {formatCurrency(item.amount)}
          </TableCell>

          <TableCell>
            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDate(item.dueDate)}
            </div>
          </TableCell>

          <TableCell>
            <Badge className={config.color}>{config.label}</Badge>
          </TableCell>

          <TableCell>
            {item.paymentDate ? (
              <div className='text-sm'>{formatDate(item.paymentDate)}</div>
            ) : (
              <span className='text-muted-foreground'>—</span>
            )}
          </TableCell>

          {showActions && (
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(item)}>
                      <Eye className='mr-2 h-4 w-4' />
                      View Details
                    </DropdownMenuItem>
                  )}

                  {onRecordPayment &&
                    item.status !== 'paid' &&
                    item.status !== 'waived' && (
                      <DropdownMenuItem onClick={() => onRecordPayment(item)}>
                        <IndianRupee className='mr-2 h-4 w-4' />
                        Record Payment
                      </DropdownMenuItem>
                    )}

                  {onEditPayment && item.paymentDate && (
                    <DropdownMenuItem onClick={() => onEditPayment(item)}>
                      <Edit className='mr-2 h-4 w-4' />
                      Edit Payment
                    </DropdownMenuItem>
                  )}

                  {(item.status === 'paid' || item.status === 'waived') && (
                    <DropdownMenuItem>
                      <Receipt className='mr-2 h-4 w-4' />
                      Download Receipt
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          )}
        </TableRow>
      );
    }
  );

PaymentScheduleItem.displayName = 'PaymentScheduleItem';
