import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CohortStudent, AttendanceRecord, AttendanceStatus } from '@/types/attendance';

interface AttendanceTableProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
  isSessionCancelled: boolean;
  isFutureDate: boolean;
  processing: boolean;
  onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  students,
  attendanceRecords,
  isSessionCancelled,
  isFutureDate,
  processing,
  onMarkAttendance,
}) => {
  const getAttendanceStatus = (studentId: string): string => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.status || 'unmarked';
  };

  const getButtonVariant = (studentId: string, status: AttendanceStatus): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" => {
    const currentStatus = getAttendanceStatus(studentId);
    return currentStatus === status ? 'default' : 'outline';
  };

  const getButtonClassName = (studentId: string, status: AttendanceStatus): string => {
    const currentStatus = getAttendanceStatus(studentId);
    const baseClasses = "transition-all duration-200";
    
    if (currentStatus === status) {
      switch (status) {
        case 'present':
          return `${baseClasses} bg-green-600 hover:bg-green-700 text-white border-green-600`;
        case 'absent':
          return `${baseClasses} bg-red-600 hover:bg-red-700 text-white border-red-600`;
        case 'late':
          return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600`;
        default:
          return baseClasses;
      }
    }
    
    return `${baseClasses} hover:bg-gray-50`;
  };

  const getRowClasses = (isCancelled: boolean) => {
    const baseClasses = "transition-colors";
    if (isCancelled) {
      return `${baseClasses} opacity-50`;
    }
    return `${baseClasses} hover:bg-muted/50`;
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No students found</p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-center">Attendance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => {
            const attendanceStatus = getAttendanceStatus(student.id);
            return (
              <TableRow key={`${student.id}-${attendanceStatus}`} className={getRowClasses(isSessionCancelled)}>
                <TableCell className="font-medium">
                  {student.first_name} {student.last_name}
                </TableCell>
                <TableCell className="text-muted-foreground">{student.email}</TableCell>
                <TableCell className="text-muted-foreground">{student.phone || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      variant={getButtonVariant(student.id, 'present')}
                      className={getButtonClassName(student.id, 'present')}
                      onClick={() => onMarkAttendance(student.id, 'present')}
                      disabled={isSessionCancelled || isFutureDate || processing}
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={getButtonVariant(student.id, 'absent')}
                      className={getButtonClassName(student.id, 'absent')}
                      onClick={() => onMarkAttendance(student.id, 'absent')}
                      disabled={isSessionCancelled || isFutureDate || processing}
                    >
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant={getButtonVariant(student.id, 'late')}
                      className={getButtonClassName(student.id, 'late')}
                      onClick={() => onMarkAttendance(student.id, 'late')}
                      disabled={isSessionCancelled || isFutureDate || processing}
                    >
                      Late
                    </Button>
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
