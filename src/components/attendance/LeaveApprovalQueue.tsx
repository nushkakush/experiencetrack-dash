import React, { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  LeaveApplication,
  UpdateLeaveApplicationRequest,
} from '@/types/attendance';

interface LeaveApprovalQueueProps {
  applications: LeaveApplication[];
  onApprove: (id: string, data: UpdateLeaveApplicationRequest) => Promise<void>;
  onReject: (id: string, data: UpdateLeaveApplicationRequest) => Promise<void>;
  loading?: boolean;
}

const getStatusBadge = (status: string) => {
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
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircle className='h-3 w-3' />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant='outline'>{status}</Badge>;
  }
};

export const LeaveApprovalQueue: React.FC<LeaveApprovalQueueProps> = ({
  applications,
  onApprove,
  onReject,
  loading = false,
}) => {
  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleApprove = async (application: LeaveApplication) => {
    setActionLoading(true);
    try {
      await onApprove(application.id, { leave_status: 'approved' });
      setSelectedApplication(null);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (application: LeaveApplication) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await onReject(application.id, {
        leave_status: 'rejected',
        leave_rejection_reason: rejectionReason.trim(),
      });
      setSelectedApplication(null);
      setRejectionReason('');
      setIsRejectDialogOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const pendingApplications = applications.filter(
    app => app.leave_status === 'pending'
  );

  if (pendingApplications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Approval Queue</CardTitle>
          <CardDescription>
            Review and approve/reject student leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <div className='mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4'>
              <CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              All Caught Up!
            </h3>
            <p className='text-gray-600 dark:text-gray-400 max-w-sm mx-auto'>
              No pending leave applications to review. Students' requests will
              appear here when they submit new applications.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leave Approval Queue</CardTitle>
          <CardDescription>
            Review and approve/reject student leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map(application => {
                  const student = (application as any).cohort_students;
                  const cohort = (application as any).cohorts;
                  const studentName = student
                    ? `${student.first_name} ${student.last_name}`
                    : 'Unknown Student';
                  const cohortName = cohort ? cohort.name : 'Unknown Cohort';

                  return (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className='font-medium'>{studentName}</div>
                      </TableCell>
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
                      <TableCell>
                        Session {application.session_number}
                      </TableCell>
                      <TableCell className='max-w-xs'>
                        <div className='truncate' title={application.reason}>
                          {application.reason}
                        </div>
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {format(
                          new Date(application.leave_applied_at),
                          'MMM dd, yyyy'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={() => handleApprove(application)}
                            disabled={loading || actionLoading}
                            className='h-8'
                          >
                            {(loading || actionLoading) && (
                              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                            )}
                            <CheckCircle className='mr-1 h-3 w-3' />
                            Approve
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => openRejectDialog(application)}
                            disabled={loading || actionLoading}
                            className='h-8'
                          >
                            <XCircle className='mr-1 h-3 w-3' />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave application. The
              student will be notified of the rejection.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className='space-y-4'>
              <div className='rounded-lg border p-3'>
                <div className='text-sm'>
                  <strong>Student:</strong>{' '}
                  {(selectedApplication as any).cohort_students?.first_name}{' '}
                  {(selectedApplication as any).cohort_students?.last_name}
                </div>
                <div className='text-sm'>
                  <strong>Date:</strong>{' '}
                  {format(
                    new Date(selectedApplication.session_date),
                    'MMM dd, yyyy'
                  )}{' '}
                  - Session {selectedApplication.session_number}
                </div>
                <div className='text-sm'>
                  <strong>Reason:</strong> {selectedApplication.reason}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='rejection-reason'>Reason for Rejection *</Label>
                <Textarea
                  id='rejection-reason'
                  placeholder='Please provide a clear reason for rejecting this leave application...'
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                selectedApplication && handleReject(selectedApplication)
              }
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
