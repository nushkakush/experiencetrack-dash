import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Phone, Mail, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { attendanceCalculations } from '@/services/attendanceCalculations.service';
import { toast } from 'sonner';

interface DropOutCandidate {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  consecutiveUninformedAbsences: number;
  lastAttendanceDate: string | null;
  totalAbsences: number;
  totalSessions: number;
}

interface DropOutRadarData {
  candidates: DropOutCandidate[];
  totalCandidates: number;
  epicInfo: {
    id: string;
    name: string;
  };
  calculatedAt: string;
}

interface DropOutRadarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  epicId: string;
  cohortName?: string;
  epicName?: string;
}

export const DropOutRadarDialog: React.FC<DropOutRadarDialogProps> = ({
  open,
  onOpenChange,
  cohortId,
  epicId,
  cohortName,
  epicName,
}) => {
  const [data, setData] = useState<DropOutRadarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && cohortId && epicId) {
      fetchDropOutData();
    }
  }, [open, cohortId, epicId]);

  const fetchDropOutData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await attendanceCalculations.getDropOutRadar({
        cohortId,
        epicId,
      });

      setData(result);
    } catch (err) {
      console.error('Failed to fetch drop out radar data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch drop out radar data'
      );
      toast.error('Failed to load drop out radar data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (consecutiveDays: number) => {
    if (consecutiveDays >= 7) {
      return (
        <Badge variant='destructive'>Critical ({consecutiveDays} days)</Badge>
      );
    } else if (consecutiveDays >= 5) {
      return <Badge variant='destructive'>High ({consecutiveDays} days)</Badge>;
    } else {
      return <Badge variant='secondary'>Medium ({consecutiveDays} days)</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never attended';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
            Drop Out Radar
          </DialogTitle>
          <DialogDescription>
            Students with 3+ consecutive uninformed absences requiring immediate
            attention
            {cohortName && epicName && (
              <span className='block mt-1 text-sm font-medium'>
                {cohortName} - {epicName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-auto'>
          {loading ? (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-32' />
                <Skeleton className='h-8 w-24' />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-4 p-4 border rounded-lg'
                >
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                  <Skeleton className='h-6 w-20' />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className='flex items-center justify-center p-8 text-red-600'>
              <AlertTriangle className='h-8 w-8 mr-2' />
              <span>Error: {error}</span>
            </div>
          ) : data ? (
            <div className='space-y-4'>
              {/* Summary Stats */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-medium'>Total Candidates:</span>
                  <span className='font-bold text-lg'>
                    {data.totalCandidates}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4 text-orange-500' />
                  <span className='text-sm font-medium'>
                    Critical (7+ days):
                  </span>
                  <span className='font-bold text-lg text-red-600'>
                    {
                      data.candidates.filter(
                        c => c.consecutiveUninformedAbsences >= 7
                      ).length
                    }
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-medium'>Last Updated:</span>
                  <span className='text-sm'>
                    {format(new Date(data.calculatedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>

              {/* Students Table */}
              {data.candidates.length > 0 ? (
                <div className='border rounded-lg'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Consecutive Days</TableHead>
                        <TableHead>Last Attendance</TableHead>
                        <TableHead>Total Absences</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.candidates.map(candidate => {
                        const attendanceRate =
                          candidate.totalSessions > 0
                            ? (
                                ((candidate.totalSessions -
                                  candidate.totalAbsences) /
                                  candidate.totalSessions) *
                                100
                              ).toFixed(1)
                            : '0.0';

                        return (
                          <TableRow
                            key={candidate.student.id}
                            className='hover:bg-muted/50'
                          >
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center'>
                                  <AlertTriangle className='h-4 w-4 text-orange-600' />
                                </div>
                                <div>
                                  <div className='font-medium'>
                                    {candidate.student.first_name}{' '}
                                    {candidate.student.last_name}
                                  </div>
                                  <div className='text-sm text-muted-foreground'>
                                    ID: {candidate.student.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='space-y-1'>
                                {candidate.student.email && (
                                  <div className='flex items-center gap-1 text-sm'>
                                    <Mail className='h-3 w-3' />
                                    <span className='truncate max-w-32'>
                                      {candidate.student.email}
                                    </span>
                                  </div>
                                )}
                                {candidate.student.phone && (
                                  <div className='flex items-center gap-1 text-sm'>
                                    <Phone className='h-3 w-3' />
                                    <span>{candidate.student.phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getSeverityBadge(
                                candidate.consecutiveUninformedAbsences
                              )}
                            </TableCell>
                            <TableCell>
                              <span className='text-sm'>
                                {formatDate(candidate.lastAttendanceDate)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className='text-sm'>
                                {candidate.totalAbsences} /{' '}
                                {candidate.totalSessions}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-sm font-medium ${
                                  parseFloat(attendanceRate) < 60
                                    ? 'text-red-600'
                                    : parseFloat(attendanceRate) < 80
                                      ? 'text-orange-600'
                                      : 'text-green-600'
                                }`}
                              >
                                {attendanceRate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center'>
                    <AlertTriangle className='h-6 w-6 text-green-600' />
                  </div>
                  <h3 className='text-lg font-medium text-green-700 mb-2'>
                    No Drop Out Candidates
                  </h3>
                  <p className='text-muted-foreground'>
                    Great! No students have 3+ consecutive uninformed absences.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
