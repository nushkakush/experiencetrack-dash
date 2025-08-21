import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, Info, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { CohortStudent, AttendanceRecord } from '@/types/attendance';

interface AttendanceTableProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
  isSessionCancelled: boolean;
  isFutureDate: boolean;
  processing: boolean;
  onMarkAttendance: (
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ) => void;
  onResetAttendance?: (studentId: string) => Promise<void>;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  attendanceRecords,
  isSessionCancelled,
  isFutureDate,
  processing,
  onMarkAttendance,
  onResetAttendance,
}) => {
  const [resettingStudent, setResettingStudent] = useState<string | null>(null);

  const handleResetAttendance = async (studentId: string) => {
    if (!onResetAttendance) return;

    setResettingStudent(studentId);
    try {
      await onResetAttendance(studentId);
      toast.success('Attendance reset successfully');
    } catch (error) {
      console.error('Error resetting attendance:', error);
      toast.error('Failed to reset attendance');
    } finally {
      setResettingStudent(null);
    }
  };
  const getAttendanceStatus = (studentId: string) => {
    return attendanceRecords.find(record => record.student_id === studentId);
  };

  const getButtonVariant = (
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ) => {
    const attendance = getAttendanceStatus(studentId);
    if (!attendance) return 'outline';
    return attendance.status === status ? 'default' : 'outline';
  };

  const getButtonClassName = (
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ) => {
    const attendance = getAttendanceStatus(studentId);
    if (!attendance) return '';

    if (attendance.status === status) {
      if (status === 'absent' && attendance.absence_type === 'exempted') {
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500';
      }
      return '';
    }
    return '';
  };

  const hasExemptedAbsence = (studentId: string) => {
    const attendance = getAttendanceStatus(studentId);
    return (
      attendance?.status === 'absent' && attendance?.absence_type === 'exempted'
    );
  };

  const getExemptedTooltipContent = (studentId: string) => {
    const attendance = getAttendanceStatus(studentId);
    if (!attendance || attendance.absence_type !== 'exempted') return '';

    return (
      <div className='max-w-xs'>
        <p className='font-semibold mb-2'>Exempted Absence</p>
        <p className='text-sm mb-2'>
          This student is marked as absent but exempted for a legitimate reason.
        </p>
        <p className='text-sm mb-2'>
          <strong>Reason:</strong> {attendance.reason || 'No reason provided'}
        </p>
        <p className='text-sm text-amber-200'>
          <strong>Impact:</strong> This absence counts as "present" for
          attendance analytics, leaderboards, and streak calculations.
        </p>
      </div>
    );
  };

  const getRowClasses = (isCancelled: boolean) => {
    const baseClasses = 'transition-colors';
    if (isCancelled) {
      return `${baseClasses} opacity-50`;
    }
    return `${baseClasses} hover:bg-muted/50`;
  };

  if (students.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>No students found</p>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className='text-center'>Attendance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => {
            const attendanceStatus = getAttendanceStatus(student.id);
            const isExempted = hasExemptedAbsence(student.id);

            return (
              <TableRow
                key={student.id}
                className={getRowClasses(isSessionCancelled)}
              >
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    {student.first_name} {student.last_name}
                    {isExempted && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant='outline'
                              className='bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            >
                              <Shield className='h-3 w-3 mr-1' />
                              Exempted
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side='right'>
                            {getExemptedTooltipContent(student.id)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {student.email}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {student.phone || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className='flex gap-1 justify-center'>
                    <Button
                      size='sm'
                      variant={getButtonVariant(student.id, 'present')}
                      className={getButtonClassName(student.id, 'present')}
                      onClick={() => onMarkAttendance(student.id, 'present')}
                      disabled={
                        isSessionCancelled || isFutureDate || processing
                      }
                    >
                      Present
                    </Button>
                    <Button
                      size='sm'
                      variant={getButtonVariant(student.id, 'absent')}
                      className={getButtonClassName(student.id, 'absent')}
                      onClick={() => onMarkAttendance(student.id, 'absent')}
                      disabled={
                        isSessionCancelled || isFutureDate || processing
                      }
                    >
                      {isExempted ? 'Exempted' : 'Absent'}
                    </Button>
                    <Button
                      size='sm'
                      variant={getButtonVariant(student.id, 'late')}
                      className={getButtonClassName(student.id, 'late')}
                      onClick={() => onMarkAttendance(student.id, 'late')}
                      disabled={
                        isSessionCancelled || isFutureDate || processing
                      }
                    >
                      Late
                    </Button>
                    {attendanceStatus && onResetAttendance && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleResetAttendance(student.id)}
                        disabled={
                          isSessionCancelled ||
                          isFutureDate ||
                          processing ||
                          resettingStudent === student.id
                        }
                        className='text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300'
                        title='Reset attendance'
                      >
                        <RotateCcw
                          className={`h-3 w-3 ${resettingStudent === student.id ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
