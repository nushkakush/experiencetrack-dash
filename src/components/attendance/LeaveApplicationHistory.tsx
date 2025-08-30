import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Info,
} from 'lucide-react';
import { LeaveApplication } from '@/types/attendance';

interface LeaveApplicationHistoryProps {
  applications: LeaveApplication[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

const getStatusBadge = (status: string, rejectionReason?: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant='secondary' className='flex items-center gap-1'>
          <Clock className='h-3 w-3' />
          Pending
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant='default' className='flex items-center gap-1'>
          <CheckCircle className='h-3 w-3' />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <div className='flex items-center gap-2'>
          <Badge variant='destructive' className='flex items-center gap-1'>
            <XCircle className='h-3 w-3' />
            Rejected
          </Badge>
          {rejectionReason && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className='bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                  >
                    <Info className='h-3 w-3 mr-1' />
                    Reason
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side='top'>{rejectionReason}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    default:
      return <Badge variant='outline'>{status}</Badge>;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600';
    case 'approved':
      return 'text-green-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const LeaveApplicationHistory: React.FC<
  LeaveApplicationHistoryProps
> = ({ applications, onDelete, loading = false }) => {
  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Application History</CardTitle>
          <CardDescription>
            Track the status of your leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <div className='mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4'>
              <FileText className='h-8 w-8 text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              No Applications Yet
            </h3>
            <p className='text-gray-600 dark:text-gray-400 max-w-sm mx-auto'>
              You haven't submitted any leave applications yet. When you apply
              for leave, your applications will appear here with their current
              status.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Application History</CardTitle>
        <CardDescription>
          Track the status of your leave applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(application => (
                <TableRow key={application.id}>
                  <TableCell className='font-medium'>
                    <div>
                      {application.is_date_range && application.end_date ? (
                        <div>
                          <div className='flex items-center gap-1 mb-1'>
                            <Badge
                              variant='outline'
                              className='text-xs bg-blue-50 text-blue-700 border-blue-300'
                            >
                              Multi-day
                            </Badge>
                          </div>
                          <div>
                            {format(
                              new Date(application.session_date),
                              'MMM dd, yyyy'
                            )}{' '}
                            -{' '}
                            {format(
                              new Date(application.end_date),
                              'MMM dd, yyyy'
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className='flex items-center gap-1 mb-1'>
                            <Badge
                              variant='outline'
                              className='text-xs bg-gray-50 text-gray-700 border-gray-300'
                            >
                              Single day
                            </Badge>
                          </div>
                          <div>
                            {format(
                              new Date(application.session_date),
                              'MMM dd, yyyy'
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>Session {application.session_number}</TableCell>
                  <TableCell className='max-w-xs truncate'>
                    {application.reason}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(
                      application.leave_status,
                      application.leave_rejection_reason
                    )}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {format(
                      new Date(application.leave_applied_at),
                      'MMM dd, yyyy'
                    )}
                  </TableCell>
                  <TableCell>
                    {application.leave_status === 'pending' && onDelete && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onDelete(application.id)}
                        disabled={loading}
                        className='h-8 w-8 p-0'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
