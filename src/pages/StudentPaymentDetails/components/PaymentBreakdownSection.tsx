import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import {
  PaymentBreakdownSectionProps,
  PaymentBreakdown,
  SemesterBreakdown,
  Instalment,
} from '@/types/components/PaymentBreakdownTypes';

export const PaymentBreakdownSection = React.memo<PaymentBreakdownSectionProps>(
  ({
    paymentBreakdown,
    expandedSemesters,
    expandedInstallments,
    onToggleSemester,
    onToggleInstallment,
    formatCurrency,
    formatDate,
  }) => {
    const getStatusBadge = (status: string, dueDate: string) => {
      const isOverdue = new Date(dueDate) < new Date();

      switch (status) {
        case 'paid':
          return (
            <Badge className='bg-green-100 text-green-800 border-green-200'>
              Paid
            </Badge>
          );
        case 'pending':
          return isOverdue ? (
            <Badge className='bg-red-100 text-red-800 border-red-200'>
              Overdue
            </Badge>
          ) : (
            <Badge className='bg-yellow-100 text-yellow-800 border-yellow-200'>
              Pending
            </Badge>
          );
        default:
          return <Badge variant='secondary'>Unknown</Badge>;
      }
    };

    if (!paymentBreakdown) {
      return (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center text-muted-foreground'>
              No payment breakdown available
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className='space-y-6'>
        {/* Overall Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calculator className='h-5 w-5' />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>
                  {formatCurrency(paymentBreakdown.totalAmount || 0)}
                </p>
                <p className='text-sm text-muted-foreground'>Total Amount</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-green-600'>
                  {formatCurrency(paymentBreakdown.paidAmount || 0)}
                </p>
                <p className='text-sm text-muted-foreground'>Amount Paid</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-orange-600'>
                  {formatCurrency(paymentBreakdown.pendingAmount || 0)}
                </p>
                <p className='text-sm text-muted-foreground'>Amount Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semesters/Installments */}
        {paymentBreakdown.semesters?.map((semester: SemesterBreakdown) => (
          <Card key={semester.semesterNumber}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Semester {semester.semesterNumber}
                </CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onToggleSemester(semester.semesterNumber)}
                >
                  {expandedSemesters.has(semester.semesterNumber) ? (
                    <ChevronUp className='h-4 w-4' />
                  ) : (
                    <ChevronDown className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </CardHeader>

            {expandedSemesters.has(semester.semesterNumber) && (
              <CardContent className='pt-0'>
                <Separator className='my-4' />
                <div className='space-y-4'>
                  {semester.installments?.map(
                    (installment: Instalment, index: number) => {
                      const installmentKey = `${semester.semesterNumber}-${index}`;

                      return (
                        <div
                          key={installmentKey}
                          className='border rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center gap-2'>
                              <IndianRupee className='h-4 w-4' />
                              <span className='font-medium'>
                                Installment {index + 1} -{' '}
                                {formatCurrency(installment.amount)}
                              </span>
                            </div>
                            <div className='flex items-center gap-2'>
                              {getStatusBadge(
                                installment.status,
                                installment.dueDate
                              )}
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  onToggleInstallment(installmentKey)
                                }
                              >
                                {expandedInstallments.has(installmentKey) ? (
                                  <ChevronUp className='h-4 w-4' />
                                ) : (
                                  <ChevronDown className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                            <div>
                              <p className='text-muted-foreground'>Due Date</p>
                              <p className='font-medium'>
                                {formatDate(installment.dueDate)}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Amount</p>
                              <p className='font-medium'>
                                {formatCurrency(installment.amount)}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Paid</p>
                              <p className='font-medium'>
                                {formatCurrency(installment.paidAmount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground'>Pending</p>
                              <p className='font-medium'>
                                {formatCurrency(installment.pendingAmount || 0)}
                              </p>
                            </div>
                          </div>

                          {expandedInstallments.has(installmentKey) && (
                            <div className='mt-4 pt-4 border-t'>
                              <p className='text-sm text-muted-foreground mb-2'>
                                Payment details and submission form would go
                                here
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  }
);

PaymentBreakdownSection.displayName = 'PaymentBreakdownSection';
